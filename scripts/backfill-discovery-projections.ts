/**
 * One-time backfill script — re-syncs all profiles to the discovery projection.
 *
 * Why: When the `createdAt` field was added to DiscoveryProfile, existing
 * projections were missing it (filtered out of "Recently Joined").
 * This script reads every PROFILE#v1 record and re-syncs to discovery.
 *
 * Also rewrites DISCOVERY#ALL with cleanup of stale duplicate entries.
 *
 * Run:
 *   ts-node scripts/backfill-discovery-projections.ts <env>
 *   e.g.  ts-node scripts/backfill-discovery-projections.ts prod
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const env = process.argv[2] || 'stage';
const isLocal = env === 'dev';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: 'ap-southeast-1',
    ...(isLocal && {
      endpoint: 'http://localhost:8000',
      credentials: { accessKeyId: 'fakeMyKeyId', secretAccessKey: 'fakeSecretAccessKey' },
    }),
  }),
);

const CORE_TABLE = `matrimony_core_${env}`;
const DISCOVERY_TABLE = `matrimony_discovery_${env}`;

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface ProfileRecord {
  PK: string;
  SK: string;
  userId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  height: number;
  religion: string;
  caste?: string;
  motherTongue: string;
  education: string;
  occupation?: string;
  country: string;
  state?: string;
  city?: string;
  maritalStatus: string;
  primaryPhotoUrl?: string;
  profileCompletion: number;
  aboutMe?: string;
  createdAt: string;
}

async function getAllProfiles(): Promise<ProfileRecord[]> {
  const profiles: ProfileRecord[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: CORE_TABLE,
        FilterExpression: 'SK = :sk',
        ExpressionAttributeValues: { ':sk': 'PROFILE#v1' },
        ExclusiveStartKey: lastKey,
      }),
    );
    if (result.Items) {
      profiles.push(...(result.Items as ProfileRecord[]));
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return profiles;
}

async function getOldDiscoveryAllEntries(userId: string): Promise<{ SK: string }[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: DISCOVERY_TABLE,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':pk': 'DISCOVERY#ALL',
        ':uid': userId,
      },
    }),
  );
  return (result.Items || []) as { SK: string }[];
}

async function getPrivacy(userId: string): Promise<{ showInSearch?: boolean } | null> {
  const result = await client.send(
    new ScanCommand({
      TableName: CORE_TABLE,
      FilterExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'PRIVACY#v1',
      },
    }),
  );
  return (result.Items?.[0] as { showInSearch?: boolean }) || null;
}

async function getAccount(userId: string): Promise<{ phone?: string } | null> {
  const result = await client.send(
    new ScanCommand({
      TableName: CORE_TABLE,
      FilterExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ACCOUNT#v1',
      },
    }),
  );
  return (result.Items?.[0] as { phone?: string }) || null;
}

async function syncProfile(profile: ProfileRecord): Promise<void> {
  const { userId } = profile;

  const [privacy, account, oldEntries] = await Promise.all([
    getPrivacy(userId),
    getAccount(userId),
    getOldDiscoveryAllEntries(userId),
  ]);

  const showInSearch = privacy?.showInSearch !== false;

  // Delete old DISCOVERY#ALL entries for this user (cleanup duplicates)
  for (const entry of oldEntries) {
    await client.send(
      new DeleteCommand({
        TableName: DISCOVERY_TABLE,
        Key: { PK: 'DISCOVERY#ALL', SK: entry.SK },
      }),
    );
  }

  if (!showInSearch) {
    // User has hidden their profile — also remove DISCOVERY#v1
    await client.send(
      new DeleteCommand({
        TableName: DISCOVERY_TABLE,
        Key: { PK: `PROFILE#${userId}`, SK: 'DISCOVERY#v1' },
      }),
    );
    return;
  }

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 0;
  const phoneVerified = !!account?.phone;
  const lastActiveAt = new Date().toISOString();
  const newAllSk = `PROFILE#${lastActiveAt}#${userId}`;

  const projection = {
    PK: `PROFILE#${userId}`,
    SK: 'DISCOVERY#v1',
    userId,
    name: profile.name,
    gender: profile.gender,
    age,
    height: profile.height,
    religion: profile.religion,
    caste: profile.caste,
    motherTongue: profile.motherTongue,
    education: profile.education,
    occupation: profile.occupation,
    country: profile.country,
    state: profile.state,
    city: profile.city,
    maritalStatus: profile.maritalStatus,
    primaryPhotoUrl: profile.primaryPhotoUrl,
    profileCompletion: profile.profileCompletion,
    aboutMe: profile.aboutMe,
    phoneVerified,
    lastActiveAt,
    createdAt: profile.createdAt,
    discoveryAllSk: newAllSk,
    GSI1PK: `COUNTRY#${profile.country}#GENDER#${profile.gender}`,
    GSI1SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
    GSI2PK: `RELIGION#${profile.religion}#GENDER#${profile.gender}`,
    GSI2SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
    ...(profile.caste
      ? {
          GSI3PK: `CASTE#${profile.caste}#GENDER#${profile.gender}`,
          GSI3SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
        }
      : {}),
  };

  await client.send(new PutCommand({ TableName: DISCOVERY_TABLE, Item: projection }));

  await client.send(
    new PutCommand({
      TableName: DISCOVERY_TABLE,
      Item: { ...projection, PK: 'DISCOVERY#ALL', SK: newAllSk },
    }),
  );
}

async function main() {
  console.log(`\n  Backfilling discovery projections for ${env} environment...\n`);

  const profiles = await getAllProfiles();
  console.log(`Found ${profiles.length} profiles to sync.\n`);

  let success = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      await syncProfile(profile);
      success++;
      console.log(`  [${success}/${profiles.length}] Synced: ${profile.name} (${profile.userId})`);
    } catch (err) {
      failed++;
      console.error(`  Failed: ${profile.userId}`, err);
    }
  }

  console.log(`\n  Done. Synced: ${success}, Failed: ${failed}\n`);
}

main().catch(console.error);

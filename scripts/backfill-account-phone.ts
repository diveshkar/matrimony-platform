/**
 * One-time backfill — copy phone from PHONE# index records to ACCOUNT#v1.phone
 *
 * Why: Before today's `validate-phone.ts` fix, that handler only wrote the
 * PHONE#{phone} index when a user verified their phone — it never updated
 * ACCOUNT#v1.phone. The discovery projection's `phoneVerified` field reads
 * from ACCOUNT#v1.phone, so users who'd actually verified their phone were
 * still showing as unverified in feeds and missing the +2 quality score.
 *
 * This script:
 *   1. Finds every USER#{userId}/PHONE#{phone} index record
 *   2. For each, checks if their ACCOUNT#v1.phone field is empty
 *   3. If empty, copies the phone over
 *   4. (Optional, with --sync flag) Re-syncs discovery projection so
 *      phoneVerified flips to true in matching feeds
 *
 * Run:
 *   npx tsx scripts/backfill-account-phone.ts <env>           — just fix accounts
 *   npx tsx scripts/backfill-account-phone.ts <env> --sync    — also re-sync discovery
 *
 * Examples:
 *   npx tsx scripts/backfill-account-phone.ts stage
 *   npx tsx scripts/backfill-account-phone.ts prod --sync
 *
 * Idempotent — safe to run multiple times.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const env = process.argv[2] || 'stage';
const shouldSync = process.argv.includes('--sync');
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

interface PhoneIndexRecord {
  PK: string; // USER#{userId}
  SK: string; // PHONE#{phone}
  phone: string;
  userId: string;
  verifiedAt?: string;
}

interface AccountRecord {
  PK: string;
  SK: string;
  userId: string;
  phone?: string;
  email?: string;
}

interface ProfileRecord {
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

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

async function findAllPhoneIndexRecords(): Promise<PhoneIndexRecord[]> {
  const records: PhoneIndexRecord[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: CORE_TABLE,
        FilterExpression: 'begins_with(SK, :sk) AND begins_with(PK, :pk)',
        ExpressionAttributeValues: {
          ':sk': 'PHONE#',
          ':pk': 'USER#',
        },
        ExclusiveStartKey: lastKey,
      }),
    );
    if (result.Items) records.push(...(result.Items as PhoneIndexRecord[]));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return records;
}

async function fixAccountPhone(record: PhoneIndexRecord): Promise<'fixed' | 'already_set' | 'no_account'> {
  const accountResult = await client.send(
    new GetCommand({
      TableName: CORE_TABLE,
      Key: { PK: `USER#${record.userId}`, SK: 'ACCOUNT#v1' },
    }),
  );

  const account = accountResult.Item as AccountRecord | undefined;
  if (!account) return 'no_account';
  if (account.phone) return 'already_set';

  await client.send(
    new UpdateCommand({
      TableName: CORE_TABLE,
      Key: { PK: `USER#${record.userId}`, SK: 'ACCOUNT#v1' },
      UpdateExpression: 'SET phone = :phone, updatedAt = :now',
      ExpressionAttributeValues: {
        ':phone': record.phone,
        ':now': new Date().toISOString(),
      },
    }),
  );

  return 'fixed';
}

/**
 * Re-syncs the discovery projection so phoneVerified=true reflects in feeds.
 * Inlined here (rather than calling the discovery service) to keep this
 * script standalone and runnable without bundling the backend.
 */
async function syncDiscoveryProjection(userId: string): Promise<'synced' | 'no_profile' | 'hidden'> {
  const profileResult = await client.send(
    new GetCommand({
      TableName: CORE_TABLE,
      Key: { PK: `USER#${userId}`, SK: 'PROFILE#v1' },
    }),
  );
  const profile = profileResult.Item as ProfileRecord | undefined;
  if (!profile) return 'no_profile';

  const privacyResult = await client.send(
    new GetCommand({
      TableName: CORE_TABLE,
      Key: { PK: `USER#${userId}`, SK: 'PRIVACY#v1' },
    }),
  );
  const showInSearch = (privacyResult.Item as { showInSearch?: boolean } | undefined)?.showInSearch !== false;
  if (!showInSearch) return 'hidden';

  // Read existing projection so we can keep its discoveryAllSk for cleanup
  const existingResult = await client.send(
    new GetCommand({
      TableName: DISCOVERY_TABLE,
      Key: { PK: `PROFILE#${userId}`, SK: 'DISCOVERY#v1' },
    }),
  );
  const existing = existingResult.Item as { discoveryAllSk?: string } | undefined;

  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 0;
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
    phoneVerified: true, // we just fixed this, that's the whole point
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

  // Clean up old DISCOVERY#ALL entry if it differs
  if (existing?.discoveryAllSk && existing.discoveryAllSk !== newAllSk) {
    try {
      await client.send(
        new DeleteCommand({
          TableName: DISCOVERY_TABLE,
          Key: { PK: 'DISCOVERY#ALL', SK: existing.discoveryAllSk },
        }),
      );
    } catch {
      /* swallow — orphaned entry is harmless */
    }
  }

  return 'synced';
}

async function main() {
  console.log(`\n  Backfilling ACCOUNT#v1.phone from PHONE# index for ${env} environment...`);
  if (shouldSync) console.log('  --sync flag set: discovery projections will be re-synced too.');
  console.log();

  const records = await findAllPhoneIndexRecords();
  console.log(`Found ${records.length} PHONE# index records.\n`);

  const stats = {
    fixed: 0,
    alreadySet: 0,
    noAccount: 0,
    synced: 0,
    syncSkippedNoProfile: 0,
    syncSkippedHidden: 0,
    errors: 0,
  };

  for (const record of records) {
    try {
      const result = await fixAccountPhone(record);

      if (result === 'fixed') {
        stats.fixed++;
        console.log(`  fixed account.phone for ${record.userId}`);
      } else if (result === 'already_set') {
        stats.alreadySet++;
      } else if (result === 'no_account') {
        stats.noAccount++;
        console.warn(`  no ACCOUNT#v1 for ${record.userId} — orphaned PHONE# record`);
      }

      if (shouldSync && result !== 'no_account') {
        const syncResult = await syncDiscoveryProjection(record.userId);
        if (syncResult === 'synced') {
          stats.synced++;
        } else if (syncResult === 'no_profile') {
          stats.syncSkippedNoProfile++;
        } else if (syncResult === 'hidden') {
          stats.syncSkippedHidden++;
        }
      }
    } catch (err) {
      stats.errors++;
      console.error(`  error processing ${record.userId}:`, err);
    }
  }

  console.log('\n  Summary:');
  console.log(`    accounts fixed:                  ${stats.fixed}`);
  console.log(`    accounts already had phone set:  ${stats.alreadySet}`);
  console.log(`    orphaned PHONE# (no account):    ${stats.noAccount}`);
  if (shouldSync) {
    console.log(`    discovery projections synced:    ${stats.synced}`);
    console.log(`    skipped (profile not yet built): ${stats.syncSkippedNoProfile}`);
    console.log(`    skipped (deactivated/hidden):    ${stats.syncSkippedHidden}`);
  }
  console.log(`    errors:                          ${stats.errors}`);
  console.log();

  if (stats.fixed > 0 && !shouldSync) {
    console.log('  Run with --sync to also re-sync discovery projections:');
    console.log(`    npx tsx scripts/backfill-account-phone.ts ${env} --sync\n`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

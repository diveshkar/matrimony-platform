import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const env = process.argv[2] || 'dev';
const isLocal = env === 'dev';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: 'ap-south-1',
    ...(isLocal && {
      endpoint: 'http://localhost:8000',
      credentials: { accessKeyId: 'fakeMyKeyId', secretAccessKey: 'fakeSecretAccessKey' },
    }),
  }),
);

const TABLE = `matrimony_core_${env}`;

const plans = [
  {
    planId: 'free',
    profileViewsPerDay: 10,
    interestsPerDay: 5,
    chatAccess: false,
    contactInfoAccess: false,
    whoViewedMeAccess: false,
    boostsPerMonth: 0,
    maxPhotos: 3,
    photoViewLimit: 1,
    photoVisibilityControl: false,
    prioritySearch: false,
  },
  {
    planId: 'silver',
    profileViewsPerDay: 30,
    interestsPerDay: 15,
    chatAccess: true,
    contactInfoAccess: false,
    whoViewedMeAccess: true,
    boostsPerMonth: 0,
    maxPhotos: 6,
    photoViewLimit: 4,
    photoVisibilityControl: true,
    prioritySearch: false,
  },
  {
    planId: 'gold',
    profileViewsPerDay: -1,
    interestsPerDay: -1,
    chatAccess: true,
    contactInfoAccess: true,
    whoViewedMeAccess: true,
    boostsPerMonth: 1,
    maxPhotos: 6,
    photoViewLimit: -1,
    photoVisibilityControl: true,
    prioritySearch: false,
  },
  {
    planId: 'platinum',
    profileViewsPerDay: -1,
    interestsPerDay: -1,
    chatAccess: true,
    contactInfoAccess: true,
    whoViewedMeAccess: true,
    boostsPerMonth: 3,
    maxPhotos: 6,
    photoViewLimit: -1,
    photoVisibilityControl: true,
    prioritySearch: true,
  },
];

async function seed() {
  console.log(`Seeding plan entitlements into ${TABLE} (${env})...\n`);

  for (const plan of plans) {
    await client.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `PLAN#${plan.planId}`,
          SK: 'ENTITLEMENT#v1',
          ...plan,
          schemaVersion: 1,
        },
      }),
    );

    console.log(
      `  ✓ ${plan.planId.padEnd(8)}: views=${String(plan.profileViewsPerDay).padEnd(3)} interests=${String(plan.interestsPerDay).padEnd(3)} chat=${String(plan.chatAccess).padEnd(5)} photos=${plan.maxPhotos} viewLimit=${String(plan.photoViewLimit).padEnd(2)} priority=${plan.prioritySearch}`,
    );
  }

  console.log('\nDone. 4 plan entitlements seeded.');
}

seed().catch(console.error);

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const env = process.argv[2] || 'dev';
const isLocal = env === 'dev';

const client = new DynamoDBClient({
  region: 'ap-south-1',
  ...(isLocal && {
    endpoint: 'http://localhost:8000',
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  }),
});

interface TableDef {
  name: string;
  gsis?: Array<{
    name: string;
    hashKey: string;
    rangeKey?: string;
  }>;
}

const tables: TableDef[] = [
  {
    name: `matrimony_core_${env}`,
    gsis: [{ name: 'GSI1', hashKey: 'GSI1PK', rangeKey: 'GSI1SK' }],
  },
  { name: `matrimony_messages_${env}` },
  {
    name: `matrimony_discovery_${env}`,
    gsis: [
      { name: 'GSI1', hashKey: 'GSI1PK', rangeKey: 'GSI1SK' },
      { name: 'GSI2', hashKey: 'GSI2PK', rangeKey: 'GSI2SK' },
    ],
  },
  { name: `matrimony_events_${env}` },
];

async function seedTables() {
  const existing = await client.send(new ListTablesCommand({}));
  const existingNames = existing.TableNames || [];

  for (const table of tables) {
    if (existingNames.includes(table.name)) {
      console.log(`Table ${table.name} already exists, skipping.`);
      continue;
    }

    const attributeDefinitions = [
      { AttributeName: 'PK', AttributeType: 'S' as const },
      { AttributeName: 'SK', AttributeType: 'S' as const },
    ];

    const gsis = table.gsis || [];
    for (const gsi of gsis) {
      if (!attributeDefinitions.find((a) => a.AttributeName === gsi.hashKey)) {
        attributeDefinitions.push({ AttributeName: gsi.hashKey, AttributeType: 'S' as const });
      }
      if (gsi.rangeKey && !attributeDefinitions.find((a) => a.AttributeName === gsi.rangeKey)) {
        attributeDefinitions.push({ AttributeName: gsi.rangeKey!, AttributeType: 'S' as const });
      }
    }

    await client.send(
      new CreateTableCommand({
        TableName: table.name,
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes:
          gsis.length > 0
            ? gsis.map((gsi) => ({
                IndexName: gsi.name,
                KeySchema: [
                  { AttributeName: gsi.hashKey, KeyType: 'HASH' as const },
                  ...(gsi.rangeKey
                    ? [{ AttributeName: gsi.rangeKey, KeyType: 'RANGE' as const }]
                    : []),
                ],
                Projection: { ProjectionType: 'ALL' as const },
              }))
            : undefined,
      }),
    );

    console.log(`Created table: ${table.name}`);
  }

  console.log(`Done. All ${env} tables ready.`);
}

seedTables().catch(console.error);

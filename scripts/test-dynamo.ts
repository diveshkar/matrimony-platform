import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: 'ap-south-1',
  endpoint: 'http://localhost:8000',
  credentials: { accessKeyId: 'fakeMyKeyId', secretAccessKey: 'fakeSecretAccessKey' },
});
const doc = DynamoDBDocumentClient.from(client);

async function test() {
  console.log('Testing DynamoDB Local...');
  await doc.send(new PutCommand({ TableName: 'matrimony_core_dev', Item: { PK: 'TEST#1', SK: 'TEST#v1', data: 'hello' } }));
  const result = await doc.send(new GetCommand({ TableName: 'matrimony_core_dev', Key: { PK: 'TEST#1', SK: 'TEST#v1' } }));
  console.log('SUCCESS:', JSON.stringify(result.Item));
}
test().catch(e => console.error('FAIL:', e.message));

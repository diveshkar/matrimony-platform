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

const CORE_TABLE = `matrimony_core_${env}`;
const DISCOVERY_TABLE = `matrimony_discovery_${env}`;

interface DemoProfile {
  name: string;
  gender: 'male' | 'female';
  dob: string;
  religion: string;
  caste?: string;
  motherTongue: string;
  education: string;
  occupation: string;
  country: string;
  city: string;
  maritalStatus: string;
  aboutMe: string;
  height: number;
}

const demoProfiles: DemoProfile[] = [
  {
    name: 'Priya Selvam',
    gender: 'female',
    dob: '1997-06-15',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Software Engineer',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Tech enthusiast who loves cooking and yoga.',
    height: 162,
  },
  {
    name: 'Anitha Rajan',
    gender: 'female',
    dob: '1995-03-22',
    religion: 'hindu',
    caste: 'Mudaliar',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Accountant',
    country: 'United Kingdom',
    city: 'Birmingham',
    maritalStatus: 'never_married',
    aboutMe: 'Family-oriented, love music and travel.',
    height: 158,
  },
  {
    name: 'Meena Kumar',
    gender: 'female',
    dob: '1998-11-08',
    religion: 'hindu',
    caste: 'Pillai',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Doctor',
    country: 'Canada',
    city: 'Toronto',
    maritalStatus: 'never_married',
    aboutMe: 'Medical professional who values tradition.',
    height: 165,
  },
  {
    name: 'Saranya Devi',
    gender: 'female',
    dob: '1996-01-30',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Teacher',
    country: 'Sri Lanka',
    city: 'Colombo',
    maritalStatus: 'never_married',
    aboutMe: 'Passionate about education and community.',
    height: 160,
  },
  {
    name: 'Kavitha Nathan',
    gender: 'female',
    dob: '1994-07-19',
    religion: 'christian',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Marketing Manager',
    country: 'United Kingdom',
    city: 'Manchester',
    maritalStatus: 'never_married',
    aboutMe: 'Creative thinker, church-going, loves hiking.',
    height: 163,
  },
  {
    name: 'Thilaga Raj',
    gender: 'female',
    dob: '1999-09-12',
    religion: 'hindu',
    caste: 'Nadar',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Nurse',
    country: 'Australia',
    city: 'Sydney',
    maritalStatus: 'never_married',
    aboutMe: 'Caring nature, love dancing and gardening.',
    height: 157,
  },
  {
    name: 'Revathi Sundaram',
    gender: 'female',
    dob: '1993-04-05',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'doctorate',
    occupation: 'Research Scientist',
    country: 'United States',
    city: 'New York',
    maritalStatus: 'never_married',
    aboutMe: 'Academic at heart, love classical music.',
    height: 168,
  },
  {
    name: 'Karthik Rajan',
    gender: 'male',
    dob: '1995-03-15',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Software Engineer',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Tech lead who enjoys cricket and cooking.',
    height: 175,
  },
  {
    name: 'Raveen Kumar',
    gender: 'male',
    dob: '1993-08-20',
    religion: 'hindu',
    caste: 'Mudaliar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Data Analyst',
    country: 'Canada',
    city: 'Toronto',
    maritalStatus: 'never_married',
    aboutMe: 'Numbers person who loves nature walks.',
    height: 178,
  },
  {
    name: 'Suresh Pillai',
    gender: 'male',
    dob: '1994-12-10',
    religion: 'hindu',
    caste: 'Pillai',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Business Owner',
    country: 'Sri Lanka',
    city: 'Jaffna',
    maritalStatus: 'never_married',
    aboutMe: 'Entrepreneur with traditional values.',
    height: 172,
  },
  {
    name: 'Dinesh Babu',
    gender: 'male',
    dob: '1996-05-25',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Civil Engineer',
    country: 'United Kingdom',
    city: 'Leeds',
    maritalStatus: 'never_married',
    aboutMe: 'Building bridges, literally and socially.',
    height: 180,
  },
  {
    name: 'Arun Prakash',
    gender: 'male',
    dob: '1992-02-14',
    religion: 'christian',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Pharmacist',
    country: 'Australia',
    city: 'Melbourne',
    maritalStatus: 'never_married',
    aboutMe: 'Health-conscious, church community active.',
    height: 176,
  },
  {
    name: 'Vijay Anand',
    gender: 'male',
    dob: '1997-10-03',
    religion: 'hindu',
    caste: 'Nadar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Finance Manager',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'City professional who values family bonds.',
    height: 174,
  },
  {
    name: 'Lakshmi Prabha',
    gender: 'female',
    dob: '1996-08-18',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'UX Designer',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Design thinker, Bharatanatyam dancer.',
    height: 161,
  },
  {
    name: 'Nithya Sri',
    gender: 'female',
    dob: '1997-02-28',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Graphic Designer',
    country: 'India',
    city: 'Chennai',
    maritalStatus: 'never_married',
    aboutMe: 'Creative soul, looking for a kind partner.',
    height: 159,
  },
];

function avatarUrl(name: string, gender: string): string {
  const bg = gender === 'female' ? '8B1A4A' : '1a3a5c';
  const color = 'ffffff';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}&size=400&bold=true&format=png`;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  )
    age--;
  return age;
}

async function seed() {
  console.log(`Seeding ${demoProfiles.length} demo profiles...\n`);

  for (let i = 0; i < demoProfiles.length; i++) {
    const p = demoProfiles[i];
    const userId = `DEMO_USER_${String(i + 1).padStart(3, '0')}`;
    const age = calcAge(p.dob);
    const now = new Date().toISOString();
    const photoUrl = avatarUrl(p.name, p.gender);

    await client.send(
      new PutCommand({
        TableName: CORE_TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'ACCOUNT#v1',
          userId,
          email: `demo${i + 1}@matrimony-test.com`,
          matrimonyId: `MTR${100000 + i}`,
          accountStatus: 'active',
          hasProfile: true,
          onboardingComplete: true,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );

    await client.send(
      new PutCommand({
        TableName: CORE_TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE#v1',
          userId,
          profileFor: 'self',
          name: p.name,
          dateOfBirth: p.dob,
          gender: p.gender,
          height: p.height,
          maritalStatus: p.maritalStatus,
          hasChildren: false,
          religion: p.religion,
          caste: p.caste,
          motherTongue: p.motherTongue,
          education: p.education,
          occupation: p.occupation,
          country: p.country,
          city: p.city,
          aboutMe: p.aboutMe,
          primaryPhotoUrl: photoUrl,
          profileCompletion: 85,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );

    await client.send(
      new PutCommand({
        TableName: DISCOVERY_TABLE,
        Item: {
          PK: `PROFILE#${userId}`,
          SK: 'DISCOVERY#v1',
          userId,
          name: p.name,
          gender: p.gender,
          age,
          height: p.height,
          religion: p.religion,
          caste: p.caste,
          motherTongue: p.motherTongue,
          education: p.education,
          occupation: p.occupation,
          country: p.country,
          city: p.city,
          maritalStatus: p.maritalStatus,
          aboutMe: p.aboutMe,
          primaryPhotoUrl: photoUrl,
          profileCompletion: 85,
          lastActiveAt: now,
          GSI1PK: `COUNTRY#${p.country}#GENDER#${p.gender}`,
          GSI1SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
          GSI2PK: `RELIGION#${p.religion}#GENDER#${p.gender}`,
          GSI2SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
        },
      }),
    );

    await client.send(
      new PutCommand({
        TableName: DISCOVERY_TABLE,
        Item: {
          PK: 'DISCOVERY#ALL',
          SK: `PROFILE#${now}#${userId}`,
          userId,
          name: p.name,
          gender: p.gender,
          age,
          height: p.height,
          religion: p.religion,
          caste: p.caste,
          motherTongue: p.motherTongue,
          education: p.education,
          occupation: p.occupation,
          country: p.country,
          city: p.city,
          maritalStatus: p.maritalStatus,
          aboutMe: p.aboutMe,
          primaryPhotoUrl: photoUrl,
          profileCompletion: 85,
          lastActiveAt: now,
          GSI1PK: `COUNTRY#${p.country}#GENDER#${p.gender}`,
          GSI1SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
          GSI2PK: `RELIGION#${p.religion}#GENDER#${p.gender}`,
          GSI2SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
        },
      }),
    );

    console.log(`  ✓ ${p.name} (${p.gender}, ${age}y, ${p.city}, ${p.country})`);
  }

  console.log(`\nDone. ${demoProfiles.length} profiles seeded.`);
}

seed().catch(console.error);

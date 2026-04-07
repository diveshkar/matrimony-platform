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
  email?: string;
  phone?: string;
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
  whatsappNumber?: string;
  personalEmail?: string;
  familyType?: string;
  familyValues?: string;
  incomeRange?: string;
}

// ── TEST ACCOUNTS ──────────────────────────────
// Login with any email below. OTP appears in terminal console (dev mode).

const demoProfiles: DemoProfile[] = [
  // ═══ FEMALES (12 profiles) ═══

  // Young, UK, Hindu
  {
    email: 'priya@test.com',
    name: 'Priya Selvam',
    gender: 'female',
    dob: '2001-06-15',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Software Engineer',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Tech enthusiast who loves cooking South Indian food and yoga. Looking for someone who values both tradition and modern thinking.',
    height: 162,
    whatsappNumber: '+447700100001',
    personalEmail: 'priya.selvam@gmail.com',
    familyType: 'nuclear',
    familyValues: 'moderate',
    incomeRange: '30000-50000',
  },
  {
    email: 'anitha@test.com',
    name: 'Anitha Rajan',
    gender: 'female',
    dob: '2000-03-22',
    religion: 'hindu',
    caste: 'Mudaliar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Accountant',
    country: 'United Kingdom',
    city: 'Birmingham',
    maritalStatus: 'never_married',
    aboutMe: 'Family-oriented, love carnatic music and travel. Searching for a kind-hearted partner who shares similar values.',
    height: 158,
    whatsappNumber: '+447700100002',
    familyType: 'joint',
    familyValues: 'orthodox',
    incomeRange: '40000-60000',
  },
  // Young, Canada, Hindu
  {
    email: 'meena@test.com',
    name: 'Meena Kumar',
    gender: 'female',
    dob: '2001-11-08',
    religion: 'hindu',
    caste: 'Pillai',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Doctor',
    country: 'Canada',
    city: 'Toronto',
    maritalStatus: 'never_married',
    aboutMe: 'Medical professional who values tradition. I enjoy reading, hiking, and volunteering at the temple.',
    height: 165,
    whatsappNumber: '+14165551001',
    familyValues: 'moderate',
    incomeRange: '80000-100000',
  },
  // Sri Lanka, Hindu
  {
    email: 'saranya@test.com',
    name: 'Saranya Devi',
    gender: 'female',
    dob: '2002-01-30',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Teacher',
    country: 'Sri Lanka',
    city: 'Colombo',
    maritalStatus: 'never_married',
    aboutMe: 'Passionate about education and community. I teach English and love Bharatanatyam dance.',
    height: 160,
    whatsappNumber: '+94771001001',
    familyType: 'joint',
    familyValues: 'orthodox',
  },
  // UK, Christian
  {
    email: 'kavitha@test.com',
    name: 'Kavitha Nathan',
    gender: 'female',
    dob: '2000-07-19',
    religion: 'christian',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Marketing Manager',
    country: 'United Kingdom',
    city: 'Manchester',
    maritalStatus: 'never_married',
    aboutMe: 'Creative thinker, church-going, loves hiking in the Peak District. Looking for a partner who shares my faith.',
    height: 163,
    whatsappNumber: '+447700100005',
    familyValues: 'moderate',
    incomeRange: '50000-70000',
  },
  // Australia, Hindu
  {
    email: 'thilaga@test.com',
    name: 'Thilaga Raj',
    gender: 'female',
    dob: '2001-09-12',
    religion: 'hindu',
    caste: 'Nadar',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Nurse',
    country: 'Australia',
    city: 'Sydney',
    maritalStatus: 'never_married',
    aboutMe: 'Caring nature, love dancing and gardening. I work in aged care and find it deeply rewarding.',
    height: 157,
    whatsappNumber: '+61400100001',
    familyValues: 'liberal',
  },
  // USA, Hindu, older
  {
    email: 'revathi@test.com',
    name: 'Revathi Sundaram',
    gender: 'female',
    dob: '1998-04-05',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'doctorate',
    occupation: 'Research Scientist',
    country: 'United States',
    city: 'New York',
    maritalStatus: 'never_married',
    aboutMe: 'Academic at heart, love classical music and reading Tamil literature. PhD in Biochemistry.',
    height: 168,
    whatsappNumber: '+12125551001',
    familyValues: 'moderate',
    incomeRange: '100000+',
  },
  // UK, Hindu, UX Designer
  {
    email: 'lakshmi@test.com',
    name: 'Lakshmi Prabha',
    gender: 'female',
    dob: '2000-08-18',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'UX Designer',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Design thinker, Bharatanatyam dancer for 15 years. I believe in creating beautiful experiences in life and work.',
    height: 161,
    whatsappNumber: '+447700100008',
    familyValues: 'moderate',
    incomeRange: '40000-60000',
  },
  // India, Hindu
  {
    email: 'nithya@test.com',
    name: 'Nithya Sri',
    gender: 'female',
    dob: '2001-02-28',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Graphic Designer',
    country: 'India',
    city: 'Chennai',
    maritalStatus: 'never_married',
    aboutMe: 'Creative soul working in advertising. Weekend artist who paints Tanjore-style art.',
    height: 159,
    whatsappNumber: '+919876543001',
    familyType: 'nuclear',
    familyValues: 'liberal',
  },
  // Divorced, UK, Hindu
  {
    email: 'deepa@test.com',
    name: 'Deepa Krishnan',
    gender: 'female',
    dob: '1996-05-10',
    religion: 'hindu',
    caste: 'Iyer',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'HR Manager',
    country: 'United Kingdom',
    city: 'Leicester',
    maritalStatus: 'divorced',
    aboutMe: 'Starting a new chapter. I am independent, career-focused, and looking for a mature partner who understands life.',
    height: 164,
    whatsappNumber: '+447700100010',
    familyValues: 'liberal',
    incomeRange: '50000-70000',
  },
  // Sri Lanka, Muslim
  {
    email: 'fathima@test.com',
    name: 'Fathima Begum',
    gender: 'female',
    dob: '2001-12-03',
    religion: 'muslim',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Pharmacist',
    country: 'Sri Lanka',
    city: 'Batticaloa',
    maritalStatus: 'never_married',
    aboutMe: 'Community-minded pharmacist. I value family, education, and deen. Love cooking biriyani for gatherings.',
    height: 155,
    whatsappNumber: '+94771001002',
    familyType: 'joint',
    familyValues: 'orthodox',
  },
  // Canada, Hindu, young
  {
    email: 'janani@test.com',
    name: 'Janani Mohan',
    gender: 'female',
    dob: '2002-07-25',
    religion: 'hindu',
    caste: 'Chettiar',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Business Analyst',
    country: 'Canada',
    city: 'Vancouver',
    maritalStatus: 'never_married',
    aboutMe: 'Data-driven thinker who loves the outdoors. Weekends are for skiing in Whistler or temple visits.',
    height: 166,
    whatsappNumber: '+16045551001',
    familyValues: 'moderate',
    incomeRange: '60000-80000',
  },

  // ═══ MALES (12 profiles) ═══

  // UK, Hindu, Software Engineer
  {
    email: 'karthik@test.com',
    name: 'Karthik Rajan',
    gender: 'male',
    dob: '2000-03-15',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Software Engineer',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Tech lead at a fintech startup. I enjoy cricket, cooking dosa on Sundays, and visiting temples.',
    height: 175,
    whatsappNumber: '+447700200001',
    personalEmail: 'karthik.rajan@gmail.com',
    familyType: 'nuclear',
    familyValues: 'moderate',
    incomeRange: '60000-80000',
  },
  // Canada, Hindu, Data Analyst
  {
    email: 'raveen@test.com',
    name: 'Raveen Kumar',
    gender: 'male',
    dob: '1998-08-20',
    religion: 'hindu',
    caste: 'Mudaliar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Data Analyst',
    country: 'Canada',
    city: 'Toronto',
    maritalStatus: 'never_married',
    aboutMe: 'Numbers person who loves nature walks around Lake Ontario. Volunteer at Tamil community center.',
    height: 178,
    whatsappNumber: '+14165552001',
    familyValues: 'moderate',
    incomeRange: '70000-90000',
  },
  // Sri Lanka, Hindu, Business Owner
  {
    email: 'suresh@test.com',
    name: 'Suresh Pillai',
    gender: 'male',
    dob: '1999-12-10',
    religion: 'hindu',
    caste: 'Pillai',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Business Owner',
    country: 'Sri Lanka',
    city: 'Jaffna',
    maritalStatus: 'never_married',
    aboutMe: 'Running a family textile business. Traditional values with an open mind. Love temple festivals.',
    height: 172,
    whatsappNumber: '+94771002001',
    familyType: 'joint',
    familyValues: 'orthodox',
    incomeRange: '40000-60000',
  },
  // UK, Hindu, Civil Engineer
  {
    email: 'dinesh@test.com',
    name: 'Dinesh Babu',
    gender: 'male',
    dob: '2001-05-25',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Civil Engineer',
    country: 'United Kingdom',
    city: 'Leeds',
    maritalStatus: 'never_married',
    aboutMe: 'Building bridges, literally and socially. Active in Tamil student associations. Love badminton.',
    height: 180,
    whatsappNumber: '+447700200004',
    familyValues: 'moderate',
    incomeRange: '40000-60000',
  },
  // Australia, Christian
  {
    email: 'arun@test.com',
    name: 'Arun Prakash',
    gender: 'male',
    dob: '1997-02-14',
    religion: 'christian',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Pharmacist',
    country: 'Australia',
    city: 'Melbourne',
    maritalStatus: 'never_married',
    aboutMe: 'Health-conscious, active in church community. Love playing guitar and volunteering at youth camps.',
    height: 176,
    whatsappNumber: '+61400200001',
    familyValues: 'moderate',
    incomeRange: '70000-90000',
  },
  // UK, Hindu, Finance
  {
    email: 'vijay@test.com',
    name: 'Vijay Anand',
    gender: 'male',
    dob: '2001-10-03',
    religion: 'hindu',
    caste: 'Nadar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Finance Manager',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'City professional who values family bonds. CFA charter holder. Weekend Tamil school volunteer.',
    height: 174,
    whatsappNumber: '+447700200006',
    familyType: 'nuclear',
    familyValues: 'moderate',
    incomeRange: '80000-100000',
  },
  // India, Hindu, Doctor
  {
    email: 'arjun@test.com',
    name: 'Arjun Venkatesh',
    gender: 'male',
    dob: '1999-06-18',
    religion: 'hindu',
    caste: 'Iyer',
    motherTongue: 'tamil',
    education: 'doctorate',
    occupation: 'Doctor',
    country: 'India',
    city: 'Chennai',
    maritalStatus: 'never_married',
    aboutMe: 'Cardiologist at Apollo. Grew up in a musical family — play veena and mridangam. Looking for a partner who appreciates arts.',
    height: 177,
    whatsappNumber: '+919876543002',
    familyType: 'joint',
    familyValues: 'orthodox',
    incomeRange: '100000+',
  },
  // Divorced, UK, Hindu
  {
    email: 'senthil@test.com',
    name: 'Senthil Murugan',
    gender: 'male',
    dob: '1995-11-20',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'IT Consultant',
    country: 'United Kingdom',
    city: 'Manchester',
    maritalStatus: 'divorced',
    aboutMe: 'Life taught me to value genuine connections. IT consultant, avid reader, and amateur chef. Looking for a fresh start.',
    height: 173,
    whatsappNumber: '+447700200008',
    familyValues: 'liberal',
    incomeRange: '60000-80000',
  },
  // Sri Lanka, Muslim
  {
    email: 'imran@test.com',
    name: 'Imran Farook',
    gender: 'male',
    dob: '2000-09-08',
    religion: 'muslim',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Civil Engineer',
    country: 'Sri Lanka',
    city: 'Colombo',
    maritalStatus: 'never_married',
    aboutMe: 'Infrastructure engineer working on rebuilding projects. Strong faith, family first. Love football.',
    height: 179,
    whatsappNumber: '+94771002002',
    familyType: 'joint',
    familyValues: 'orthodox',
  },
  // Canada, Hindu, young
  {
    email: 'ravi@test.com',
    name: 'Ravi Shankar',
    gender: 'male',
    dob: '2002-01-12',
    religion: 'hindu',
    caste: 'Chettiar',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Product Manager',
    country: 'Canada',
    city: 'Montreal',
    maritalStatus: 'never_married',
    aboutMe: 'Working in tech, passionate about Tamil culture. I organize Tamil heritage events in Montreal. Love ice hockey.',
    height: 171,
    whatsappNumber: '+15145551001',
    familyValues: 'moderate',
    incomeRange: '50000-70000',
  },
  // UK, Hindu, Lawyer
  {
    email: 'mohan@test.com',
    name: 'Mohan Raj',
    gender: 'male',
    dob: '1998-04-30',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Lawyer',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Solicitor specializing in family law. Classical music lover, temple trustee. Value honesty and simplicity.',
    height: 182,
    whatsappNumber: '+447700200011',
    familyType: 'nuclear',
    familyValues: 'moderate',
    incomeRange: '80000-100000',
  },
  // Germany, Hindu
  {
    email: 'kumar@test.com',
    name: 'Kumar Selvan',
    gender: 'male',
    dob: '2000-08-05',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Mechanical Engineer',
    country: 'Germany',
    city: 'Munich',
    maritalStatus: 'never_married',
    aboutMe: 'Automotive engineer at BMW. Love traveling Europe, cooking, and learning new languages. Speak Tamil, English, and German.',
    height: 176,
    whatsappNumber: '+491701001001',
    familyValues: 'liberal',
    incomeRange: '70000-90000',
  },

  // ═══ PHONE-ONLY ACCOUNTS (WhatsApp login) ═══

  {
    phone: '+447700300001',
    name: 'Shalini Raj',
    gender: 'female',
    dob: '2001-03-14',
    religion: 'hindu',
    caste: 'Vellalar',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Dental Nurse',
    country: 'United Kingdom',
    city: 'London',
    maritalStatus: 'never_married',
    aboutMe: 'Friendly and caring. Love Tamil movies and cooking. Looking for a kind partner.',
    height: 160,
    whatsappNumber: '+447700300001',
    familyValues: 'moderate',
  },
  {
    phone: '+447700300002',
    name: 'Tharan Kumar',
    gender: 'male',
    dob: '1999-07-22',
    religion: 'hindu',
    motherTongue: 'tamil',
    education: 'bachelors',
    occupation: 'Delivery Manager',
    country: 'United Kingdom',
    city: 'Birmingham',
    maritalStatus: 'never_married',
    aboutMe: 'Hardworking and family-oriented. Weekend cricket player. Looking for a life partner.',
    height: 174,
    whatsappNumber: '+447700300002',
    familyValues: 'orthodox',
  },

  // ═══ BOTH PHONE + EMAIL ACCOUNTS ═══

  {
    email: 'sowmya@test.com',
    phone: '+447700400001',
    name: 'Sowmya Nair',
    gender: 'female',
    dob: '2000-11-08',
    religion: 'hindu',
    caste: 'Pillai',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'Data Scientist',
    country: 'United Kingdom',
    city: 'Cambridge',
    maritalStatus: 'never_married',
    aboutMe: 'Love data, books, and long walks. Looking for someone who values intellect and kindness.',
    height: 163,
    whatsappNumber: '+447700400001',
    familyValues: 'moderate',
    incomeRange: '60000-80000',
  },
  {
    email: 'prashanth@test.com',
    phone: '+447700400002',
    name: 'Prashanth Kannan',
    gender: 'male',
    dob: '1998-05-17',
    religion: 'hindu',
    caste: 'Mudaliar',
    motherTongue: 'tamil',
    education: 'masters',
    occupation: 'DevOps Engineer',
    country: 'United Kingdom',
    city: 'Edinburgh',
    maritalStatus: 'never_married',
    aboutMe: 'Tech enthusiast and part-time musician. Play mridangam at the local temple. Looking for a partner who shares Tamil values.',
    height: 178,
    whatsappNumber: '+447700400002',
    familyValues: 'moderate',
    incomeRange: '50000-70000',
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
  console.log(`Seeding ${demoProfiles.length} demo profiles into ${CORE_TABLE} (${env})...\n`);

  for (let i = 0; i < demoProfiles.length; i++) {
    const p = demoProfiles[i];
    const userId = `DEMO_USER_${String(i + 1).padStart(3, '0')}`;
    const age = calcAge(p.dob);
    const now = new Date().toISOString();
    const photoUrl = avatarUrl(p.name, p.gender);

    // Account record
    await client.send(
      new PutCommand({
        TableName: CORE_TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'ACCOUNT#v1',
          userId,
          ...(p.email && { email: p.email }),
          ...(p.phone && { phone: p.phone }),
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

    // Email index (for login lookup)
    if (p.email) {
    await client.send(
      new PutCommand({
        TableName: CORE_TABLE,
        Item: {
          PK: `EMAIL#${p.email}`,
          SK: 'ACCOUNT#v1',
          userId,
          GSI1PK: `EMAIL#${p.email}`,
          GSI1SK: 'ACCOUNT#v1',
        },
      }),
    );
    }

    // Phone index (for login lookup)
    if (p.phone) {
      await client.send(
        new PutCommand({
          TableName: CORE_TABLE,
          Item: {
            PK: `PHONE#${p.phone}`,
            SK: 'ACCOUNT#v1',
            userId,
            GSI1PK: `PHONE#${p.phone}`,
            GSI1SK: 'ACCOUNT#v1',
          },
        }),
      );
    }

    // Profile record
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
          whatsappNumber: p.whatsappNumber,
          personalEmail: p.personalEmail,
          familyType: p.familyType,
          familyValues: p.familyValues,
          incomeRange: p.incomeRange,
          profileCompletion: 90,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );

    // Privacy defaults
    await client.send(
      new PutCommand({
        TableName: CORE_TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PRIVACY#v1',
          userId,
          hideWhatsapp: false,
          hideDob: false,
          photoVisibility: 'all',
          horoscopeVisibility: 'all',
          showInSearch: true,
          schemaVersion: 1,
          updatedAt: now,
        },
      }),
    );

    // Discovery projection
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
          profileCompletion: 90,
          lastActiveAt: now,
          GSI1PK: `COUNTRY#${p.country}#GENDER#${p.gender}`,
          GSI1SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
          GSI2PK: `RELIGION#${p.religion}#GENDER#${p.gender}`,
          GSI2SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
        },
      }),
    );

    // Discovery ALL record
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
          profileCompletion: 90,
          lastActiveAt: now,
          GSI1PK: `COUNTRY#${p.country}#GENDER#${p.gender}`,
          GSI1SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
          GSI2PK: `RELIGION#${p.religion}#GENDER#${p.gender}`,
          GSI2SK: `AGE#${String(age).padStart(3, '0')}#${userId}`,
        },
      }),
    );

    console.log(`  ${(p.email || p.phone || '').padEnd(22)} ${p.name.padEnd(20)} ${p.gender.padEnd(7)} ${age}y  ${p.country.padEnd(15)} ${p.religion}`);
  }

  // ── SUBSCRIPTION RECORDS ──────────────────
  // Assign different plans to specific users for testing

  const loginToUserId: Record<string, string> = {};
  demoProfiles.forEach((p, i) => {
    const uid = `DEMO_USER_${String(i + 1).padStart(3, '0')}`;
    if (p.email) loginToUserId[p.email] = uid;
    if (p.phone) loginToUserId[p.phone] = uid;
  });

  const subscriptions = [
    { login: 'anitha@test.com', planId: 'silver' },
    { login: 'raveen@test.com', planId: 'silver' },
    { login: '+447700300001', planId: 'silver' },
    { login: 'priya@test.com', planId: 'gold' },
    { login: 'karthik@test.com', planId: 'gold' },
    { login: 'revathi@test.com', planId: 'gold' },
    { login: 'arjun@test.com', planId: 'gold' },
    { login: 'sowmya@test.com', planId: 'gold' },
    { login: 'mohan@test.com', planId: 'platinum' },
    { login: 'vijay@test.com', planId: 'platinum' },
  ];

  console.log('\n  Seeding subscriptions...');
  const subNow = new Date().toISOString();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);

  for (const sub of subscriptions) {
    const uid = loginToUserId[sub.login];
    if (!uid) continue;

    await client.send(
      new PutCommand({
        TableName: CORE_TABLE,
        Item: {
          PK: `USER#${uid}`,
          SK: 'SUBSCRIPTION#ACTIVE',
          userId: uid,
          planId: sub.planId,
          stripeSubscriptionId: `sub_test_${uid}`,
          stripeCustomerId: `cus_test_${uid}`,
          startDate: subNow,
          endDate: endDate.toISOString(),
          status: 'active',
          schemaVersion: 1,
          createdAt: subNow,
          updatedAt: subNow,
        },
      }),
    );

    console.log(`    ${sub.login.padEnd(22)} → ${sub.planId}`);
  }

  // ── PRINT SUMMARY ──────────────────────────

  console.log(`\nDone. ${demoProfiles.length} profiles + ${subscriptions.length} subscriptions seeded.`);
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  TEST LOGIN ACCOUNTS');
  console.log('  Login with email or WhatsApp. OTP appears in terminal (dev mode).');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const planMap: Record<string, string> = {};
  subscriptions.forEach((s) => { planMap[s.login] = s.planId; });

  console.log('  LOGIN                 NAME                 PLAN       GENDER  AGE  COUNTRY');
  console.log('  ─────────────────────────────────────────────────────────────────────────');
  demoProfiles.forEach((p) => {
    const loginId = p.email || p.phone || '';
    const login = loginId.padEnd(22);
    const plan = planMap[loginId] || (p.phone && planMap[p.phone]) || 'free';
    const planLabel = plan.toUpperCase().padEnd(10);
    const loginType = p.phone && p.email ? '(Both)' : p.phone ? '(WhatsApp)' : '(Email)';
    console.log(`  ${login} ${p.name.padEnd(20)} ${planLabel} ${p.gender.padEnd(7)} ${String(calcAge(p.dob)).padEnd(4)} ${p.country} ${loginType}`);
  });

}

seed().catch(console.error);

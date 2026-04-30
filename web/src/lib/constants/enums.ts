export const PROFILE_FOR_OPTIONS = [
  { value: 'self', label: 'Myself' },
  { value: 'son', label: 'My Son' },
  { value: 'daughter', label: 'My Daughter' },
  { value: 'brother', label: 'My Brother' },
  { value: 'sister', label: 'My Sister' },
  { value: 'relative', label: 'My Relative' },
  { value: 'friend', label: 'My Friend' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

export const RELIGION_OPTIONS = [
  { value: 'hindu', label: 'Hindu' },
  { value: 'christian', label: 'Christian' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'buddhist', label: 'Buddhist' },
] as const;

export const CASTE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  hindu: [
    { value: 'vellalar', label: 'Vellalar' },
    { value: 'mudaliar', label: 'Mudaliar' },
    { value: 'pillai', label: 'Pillai' },
    { value: 'nadar', label: 'Nadar' },
    { value: 'gounder', label: 'Gounder' },
    { value: 'chettiar', label: 'Chettiar' },
    { value: 'thevar', label: 'Thevar' },
    { value: 'kallar', label: 'Kallar' },
    { value: 'maravar', label: 'Maravar' },
    { value: 'agamudaiyar', label: 'Agamudaiyar' },
    { value: 'iyer', label: 'Iyer' },
    { value: 'iyengar', label: 'Iyengar' },
    { value: 'naicker', label: 'Naicker' },
    { value: 'reddiar', label: 'Reddiar' },
    { value: 'vanniyar', label: 'Vanniyar' },
    { value: 'yadav', label: 'Yadav' },
    { value: 'vishwakarma', label: 'Vishwakarma' },
    { value: 'other_hindu', label: 'Other' },
  ],
  christian: [
    { value: 'roman_catholic', label: 'Roman Catholic' },
    { value: 'csi', label: 'CSI (Church of South India)' },
    { value: 'pentecostal', label: 'Pentecostal' },
    { value: 'methodist', label: 'Methodist' },
    { value: 'baptist', label: 'Baptist' },
    { value: 'lutheran', label: 'Lutheran' },
    { value: 'other_christian', label: 'Other' },
  ],
  muslim: [
    { value: 'sunni', label: 'Sunni' },
    { value: 'shia', label: 'Shia' },
    { value: 'other_muslim', label: 'Other' },
  ],
  buddhist: [
    { value: 'theravada', label: 'Theravada' },
    { value: 'mahayana', label: 'Mahayana' },
    { value: 'other_buddhist', label: 'Other' },
  ],
};

export const DENOMINATION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  hindu: [
    { value: 'saivite', label: 'Saivite' },
    { value: 'vaishnavite', label: 'Vaishnavite' },
    { value: 'smartha', label: 'Smartha' },
    { value: 'other_hindu', label: 'Other' },
  ],
  christian: [
    { value: 'roman_catholic', label: 'Roman Catholic' },
    { value: 'protestant', label: 'Protestant' },
    { value: 'pentecostal', label: 'Pentecostal' },
    { value: 'methodist', label: 'Methodist' },
    { value: 'baptist', label: 'Baptist' },
    { value: 'csi', label: 'CSI' },
    { value: 'other_christian', label: 'Other' },
  ],
  muslim: [
    { value: 'sunni', label: 'Sunni' },
    { value: 'shia', label: 'Shia' },
    { value: 'other_muslim', label: 'Other' },
  ],
  buddhist: [
    { value: 'theravada', label: 'Theravada' },
    { value: 'mahayana', label: 'Mahayana' },
    { value: 'other_buddhist', label: 'Other' },
  ],
};

export const HEIGHT_OPTIONS = Array.from({ length: 51 }, (_, i) => {
  const cm = 150 + i;
  const feet = Math.floor(cm / 30.48);
  const inches = Math.round((cm % 30.48) / 2.54);
  return { value: String(cm), label: `${cm} cm (${feet}'${inches}")` };
});

export const MARITAL_STATUS_OPTIONS = [
  { value: 'never_married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
] as const;

export const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate / PhD' },
  { value: 'professional', label: 'Professional Degree' },
  { value: 'other', label: 'Other' },
] as const;

export const EDUCATION_FIELD_OPTIONS = [
  { value: 'engineering', label: 'Engineering / Technology' },
  { value: 'medicine', label: 'Medicine / Healthcare' },
  { value: 'business', label: 'Business / Management' },
  { value: 'law', label: 'Law' },
  { value: 'arts', label: 'Arts / Humanities' },
  { value: 'science', label: 'Science' },
  { value: 'commerce', label: 'Commerce / Accounting' },
  { value: 'education', label: 'Education / Teaching' },
  { value: 'it', label: 'IT / Computer Science' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'architecture', label: 'Architecture / Design' },
  { value: 'other', label: 'Other' },
] as const;

export const OCCUPATION_OPTIONS = [
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'doctor', label: 'Doctor / Physician' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'engineer', label: 'Engineer (Non-IT)' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'lawyer', label: 'Lawyer / Solicitor' },
  { value: 'teacher', label: 'Teacher / Lecturer' },
  { value: 'professor', label: 'Professor' },
  { value: 'banker', label: 'Banker' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'civil_servant', label: 'Civil Servant' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'data_analyst', label: 'Data Analyst / Scientist' },
  { value: 'designer', label: 'Designer' },
  { value: 'marketing', label: 'Marketing Professional' },
  { value: 'finance', label: 'Finance Professional' },
  { value: 'research', label: 'Research Scientist' },
  { value: 'architect', label: 'Architect' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'not_working', label: 'Not Working' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
] as const;

const CURRENCY_MAP: Record<string, { symbol: string; ranges: number[] }> = {
  'United Kingdom': { symbol: '£', ranges: [20000, 40000, 60000, 80000, 100000] },
  'United States': { symbol: '$', ranges: [30000, 50000, 75000, 100000, 150000] },
  'Canada': { symbol: 'C$', ranges: [30000, 50000, 75000, 100000, 150000] },
  'Australia': { symbol: 'A$', ranges: [30000, 50000, 75000, 100000, 150000] },
  // 'India': { symbol: '₹', ranges: [300000, 600000, 1000000, 1500000, 2500000] },
  'Sri Lanka': { symbol: 'Rs', ranges: [500000, 1000000, 2000000, 3000000, 5000000] },
  'Germany': { symbol: '€', ranges: [25000, 40000, 60000, 80000, 100000] },
  'France': { symbol: '€', ranges: [25000, 40000, 60000, 80000, 100000] },
  // 'UAE': { symbol: 'AED', ranges: [50000, 100000, 200000, 300000, 500000] },
  'Singapore': { symbol: 'S$', ranges: [30000, 50000, 80000, 120000, 200000] },
  // 'Malaysia': { symbol: 'RM', ranges: [30000, 60000, 100000, 150000, 250000] },
  'New Zealand': { symbol: 'NZ$', ranges: [30000, 50000, 75000, 100000, 150000] },
};

function formatCurrency(symbol: string, amount: number): string {
  if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}K`;
  return `${symbol}${amount}`;
}

export function getIncomeOptions(country?: string): { value: string; label: string }[] {
  const config = country ? CURRENCY_MAP[country] : undefined;
  const sym = config?.symbol || '£';
  const ranges = config?.ranges || [20000, 40000, 60000, 80000, 100000];

  return [
    { value: 'range_1', label: `Below ${formatCurrency(sym, ranges[0])}` },
    { value: 'range_2', label: `${formatCurrency(sym, ranges[0])} - ${formatCurrency(sym, ranges[1])}` },
    { value: 'range_3', label: `${formatCurrency(sym, ranges[1])} - ${formatCurrency(sym, ranges[2])}` },
    { value: 'range_4', label: `${formatCurrency(sym, ranges[2])} - ${formatCurrency(sym, ranges[3])}` },
    { value: 'range_5', label: `${formatCurrency(sym, ranges[3])} - ${formatCurrency(sym, ranges[4])}` },
    { value: 'range_6', label: `Above ${formatCurrency(sym, ranges[4])}` },
    { value: 'prefer_not', label: 'Prefer not to say' },
  ];
}

// Default for backward compatibility
export const INCOME_OPTIONS = getIncomeOptions('United Kingdom');

export const COUNTRY_OPTIONS = [
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Sri Lanka', label: 'Sri Lanka' },
  // { value: 'India', label: 'India' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'United States', label: 'United States' },
  // { value: 'United Arab Emirates', label: 'United Arab Emirates' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Singapore', label: 'Singapore' },
  // { value: 'Malaysia', label: 'Malaysia' },
  { value: 'New Zealand', label: 'New Zealand' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Norway', label: 'Norway' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'Denmark', label: 'Denmark' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
  { value: 'Other', label: 'Other' },
] as const;

export const FAMILY_TYPE_OPTIONS = [
  { value: 'joint', label: 'Joint Family' },
  { value: 'nuclear', label: 'Nuclear Family' },
] as const;

export const FAMILY_STATUS_OPTIONS = [
  { value: 'middle_class', label: 'Middle Class' },
  { value: 'upper_middle', label: 'Upper Middle Class' },
  { value: 'rich', label: 'Rich / Affluent' },
] as const;

export const FAMILY_VALUES_OPTIONS = [
  { value: 'orthodox', label: 'Orthodox' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'liberal', label: 'Liberal' },
] as const;

export const MOTHER_TONGUE_OPTIONS = [
  { value: 'tamil', label: 'Tamil' },
  { value: 'sinhala', label: 'Sinhala' },
  { value: 'english', label: 'English' },
] as const;

export const RAASI_OPTIONS = [
  { value: 'Mesham', label: 'Mesham (Aries)' },
  { value: 'Rishabam', label: 'Rishabam (Taurus)' },
  { value: 'Mithunam', label: 'Mithunam (Gemini)' },
  { value: 'Kadagam', label: 'Kadagam (Cancer)' },
  { value: 'Simmam', label: 'Simmam (Leo)' },
  { value: 'Kanni', label: 'Kanni (Virgo)' },
  { value: 'Thulaam', label: 'Thulaam (Libra)' },
  { value: 'Virichigam', label: 'Virichigam (Scorpio)' },
  { value: 'Dhanusu', label: 'Dhanusu (Sagittarius)' },
  { value: 'Magaram', label: 'Magaram (Capricorn)' },
  { value: 'Kumbam', label: 'Kumbam (Aquarius)' },
  { value: 'Meenam', label: 'Meenam (Pisces)' },
] as const;

export const NATCHATHIRAM_OPTIONS = [
  { value: 'Ashwini', label: 'Ashwini' },
  { value: 'Bharani', label: 'Bharani' },
  { value: 'Karthigai', label: 'Karthigai' },
  { value: 'Rohini', label: 'Rohini' },
  { value: 'Mrigashirisham', label: 'Mrigashirisham' },
  { value: 'Thiruvathirai', label: 'Thiruvathirai' },
  { value: 'Punarpoosam', label: 'Punarpoosam' },
  { value: 'Poosam', label: 'Poosam' },
  { value: 'Ayilyam', label: 'Ayilyam' },
  { value: 'Magam', label: 'Magam' },
  { value: 'Pooram', label: 'Pooram' },
  { value: 'Uthiram', label: 'Uthiram' },
  { value: 'Hastham', label: 'Hastham' },
  { value: 'Chithirai', label: 'Chithirai' },
  { value: 'Swathi', label: 'Swathi' },
  { value: 'Vishakam', label: 'Vishakam' },
  { value: 'Anusham', label: 'Anusham' },
  { value: 'Kettai', label: 'Kettai' },
  { value: 'Moolam', label: 'Moolam' },
  { value: 'Pooradam', label: 'Pooradam' },
  { value: 'Uthiradam', label: 'Uthiradam' },
  { value: 'Thiruvonam', label: 'Thiruvonam' },
  { value: 'Avittam', label: 'Avittam' },
  { value: 'Sathayam', label: 'Sathayam' },
  { value: 'Poorattathi', label: 'Poorattathi' },
  { value: 'Uthirattathi', label: 'Uthirattathi' },
  { value: 'Revathi', label: 'Revathi' },
] as const;

export const PHOTO_VISIBILITY_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'contacts', label: 'Contacts Only' },
  { value: 'hidden', label: 'Hidden' },
] as const;

export const INTEREST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const;

export const PLAN_NAMES = {
  FREE: 'free',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

export const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
] as const;

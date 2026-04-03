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

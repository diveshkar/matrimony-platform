import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone number must be in E.164 format');

export const emailSchema = z.string().email('Invalid email address');

export const authStartSchema = z.object({
  email: emailSchema,
});

export const authVerifySchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const createProfileSchema = z.object({
  profileFor: z.enum(['self', 'son', 'daughter', 'brother', 'sister', 'relative', 'friend']),
  name: z.string().min(2).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female']),
  height: z.number().min(120).max(220),
  maritalStatus: z.enum(['never_married', 'divorced', 'widowed', 'separated']),
  hasChildren: z.boolean(),
  childrenCount: z.number().min(0).max(10).optional(),
  religion: z.string().min(1).max(50),
  caste: z.string().max(100).optional(),
  subCaste: z.string().max(100).optional(),
  denomination: z.string().max(100).optional(),
  motherTongue: z.string().min(1).max(50),
  gothram: z.string().max(100).optional(),
  education: z.string().min(1).max(100),
  educationField: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  employer: z.string().max(100).optional(),
  incomeRange: z.string().max(50).optional(),
  whatsappNumber: z.string().max(20).optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  country: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  fatherOccupation: z.string().max(100).optional(),
  motherOccupation: z.string().max(100).optional(),
  brothersCount: z.number().min(0).max(15).optional(),
  brothersMarried: z.number().min(0).max(15).optional(),
  sistersCount: z.number().min(0).max(15).optional(),
  sistersMarried: z.number().min(0).max(15).optional(),
  familyType: z.enum(['joint', 'nuclear']).optional(),
  familyStatus: z.enum(['middle_class', 'upper_middle', 'rich']).optional(),
  familyValues: z.enum(['orthodox', 'moderate', 'liberal']).optional(),
  aboutMe: z.string().max(2000).optional(),
});

export const updateProfileSchema = createProfileSchema.partial();

export const preferencesSchema = z.object({
  ageMin: z.number().min(18).max(70),
  ageMax: z.number().min(18).max(70),
  heightMin: z.number().min(120).max(220).optional(),
  heightMax: z.number().min(120).max(220).optional(),
  religions: z.array(z.string()).optional(),
  castes: z.array(z.string()).optional(),
  educations: z.array(z.string()).optional(),
  occupations: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  maritalStatuses: z.array(z.string()).optional(),
});

export const privacySettingsSchema = z.object({
  hideWhatsapp: z.boolean(),
  hideDob: z.boolean(),
  photoVisibility: z.enum(['all', 'contacts', 'hidden']),
  horoscopeVisibility: z.enum(['all', 'contacts', 'hidden']),
  showInSearch: z.boolean(),
});

export const sendInterestSchema = z.object({
  receiverId: z.string().min(1),
  message: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const reportSchema = z.object({
  reportedUserId: z.string().min(1),
  reason: z.enum(['fake_profile', 'harassment', 'inappropriate_content', 'spam', 'other']),
  description: z.string().max(1000).optional(),
});

export const searchFiltersSchema = z.object({
  gender: z.enum(['male', 'female']).optional(),
  ageMin: z.coerce.number().min(18).max(70).optional(),
  ageMax: z.coerce.number().min(18).max(70).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  education: z.string().optional(),
  maritalStatus: z.string().optional(),
  hasPhoto: z.coerce.boolean().optional(),
});

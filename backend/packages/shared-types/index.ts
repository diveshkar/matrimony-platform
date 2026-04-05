export interface UserAccount {
  PK: string;
  SK: string;
  userId: string;
  phone?: string;
  email: string;
  matrimonyId: string;
  accountStatus: 'active' | 'suspended' | 'deleted';
  hasProfile: boolean;
  onboardingComplete: boolean;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  PK: string;
  SK: string;
  userId: string;
  profileFor: 'self' | 'son' | 'daughter' | 'brother' | 'sister' | 'relative' | 'friend';
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  height: number;
  maritalStatus: 'never_married' | 'divorced' | 'widowed' | 'separated';
  hasChildren: boolean;
  childrenCount?: number;
  religion: string;
  caste?: string;
  subCaste?: string;
  denomination?: string;
  motherTongue: string;
  gothram?: string;
  education: string;
  educationField?: string;
  occupation?: string;
  employer?: string;
  incomeRange?: string;
  whatsappNumber?: string;
  personalEmail?: string;
  country: string;
  state?: string;
  city?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  brothersCount?: number;
  brothersMarried?: number;
  sistersCount?: number;
  sistersMarried?: number;
  familyType?: 'joint' | 'nuclear';
  familyStatus?: 'middle_class' | 'upper_middle' | 'rich';
  familyValues?: 'orthodox' | 'moderate' | 'liberal';
  aboutMe?: string;
  primaryPhotoUrl?: string;
  profileCompletion: number;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  PK: string;
  SK: string;
  userId: string;
  ageMin: number;
  ageMax: number;
  heightMin?: number;
  heightMax?: number;
  religions?: string[];
  castes?: string[];
  educations?: string[];
  occupations?: string[];
  countries?: string[];
  maritalStatuses?: string[];
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPrivacy {
  PK: string;
  SK: string;
  userId: string;
  hideWhatsapp: boolean;
  hideDob: boolean;
  photoVisibility: 'all' | 'contacts' | 'hidden';
  horoscopeVisibility: 'all' | 'contacts' | 'hidden';
  showInSearch: boolean;
  schemaVersion: number;
  updatedAt: string;
}

export interface PhotoMetadata {
  PK: string;
  SK: string;
  userId: string;
  photoId: string;
  s3Key: string;
  url: string;
  isPrimary: boolean;
  visibility: 'all' | 'contacts' | 'hidden';
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface Interest {
  PK: string;
  SK: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  PK: string;
  SK: string;
  conversationId: string;
  participantIds: [string, string];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  PK: string;
  SK: string;
  conversationId: string;
  messageId: string;
  senderId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface UserSubscription {
  PK: string;
  SK: string;
  userId: string;
  planId: 'free' | 'silver' | 'gold' | 'platinum';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled' | 'expired';
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanEntitlement {
  PK: string;
  SK: string;
  planId: string;
  profileViewsPerDay: number;
  interestsPerDay: number;
  chatAccess: boolean;
  contactInfoAccess: boolean;
  whoViewedMeAccess: boolean;
  boostsPerMonth: number;
  schemaVersion: number;
}

export interface Notification {
  PK: string;
  SK: string;
  userId: string;
  notificationId: string;
  type:
    | 'interest_received'
    | 'interest_accepted'
    | 'new_message'
    | 'plan_purchased'
    | 'plan_expiry'
    | 'welcome';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// User & Account
export interface UserAccount {
  PK: string; // USER#<userId>
  SK: string; // ACCOUNT#v1
  userId: string;
  phone: string; // E.164 format
  email?: string;
  matrimonyId: string;
  accountStatus: 'active' | 'suspended' | 'deleted';
  hasProfile: boolean;
  onboardingComplete: boolean;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

// Profile
export interface UserProfile {
  PK: string; // USER#<userId>
  SK: string; // PROFILE#v1
  userId: string;
  profileFor: 'self' | 'son' | 'daughter' | 'brother' | 'sister' | 'relative' | 'friend';
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  height: number; // in cm
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

// Partner Preferences
export interface UserPreference {
  PK: string; // USER#<userId>
  SK: string; // PREFERENCE#v1
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

// Privacy
export interface UserPrivacy {
  PK: string; // USER#<userId>
  SK: string; // PRIVACY#v1
  userId: string;
  hidePhone: boolean;
  hideDob: boolean;
  photoVisibility: 'all' | 'contacts' | 'hidden';
  horoscopeVisibility: 'all' | 'contacts' | 'hidden';
  showInSearch: boolean;
  schemaVersion: number;
  updatedAt: string;
}

// Photo
export interface PhotoMetadata {
  PK: string; // USER#<userId>
  SK: string; // PHOTO#<photoId>
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

// Interest
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

// Chat
export interface Conversation {
  PK: string; // CONV#<conversationId>
  SK: string; // META#v1
  conversationId: string;
  participantIds: [string, string];
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  PK: string; // CONV#<conversationId>
  SK: string; // MSG#<timestamp>#<messageId>
  conversationId: string;
  messageId: string;
  senderId: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

// Subscription
export interface UserSubscription {
  PK: string; // USER#<userId>
  SK: string; // SUBSCRIPTION#ACTIVE
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
  PK: string; // PLAN#<planId>
  SK: string; // ENTITLEMENT#v1
  planId: string;
  profileViewsPerDay: number;
  interestsPerDay: number;
  chatAccess: boolean;
  contactInfoAccess: boolean;
  whoViewedMeAccess: boolean;
  boostsPerMonth: number;
  schemaVersion: number;
}

// Notification
export interface Notification {
  PK: string; // USER#<userId>
  SK: string; // NOTIFICATION#<timestamp>#<notificationId>
  userId: string;
  notificationId: string;
  type: 'interest_received' | 'interest_accepted' | 'new_message' | 'plan_purchased' | 'plan_expiry' | 'welcome';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

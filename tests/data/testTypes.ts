/**
 * NestMate — Test Universe Types & Interfaces
 * Exact schema reflection from firestore.rules and application code.
 */

export type UserRole = 'seeker' | 'owner' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export type OwnerVerificationStatus =
  | 'NOT_STARTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED';

export type ListingStatus =
  | 'draft'
  | 'pending_verification'
  | 'active'
  | 'paused'
  | 'filled'
  | 'closed'
  | 'expired';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface QuizAnswers {
  sleep_time?: string;
  wake_time?: string;
  food_pref?: string;
  smoking?: string;
  drinking?: string;
  guests?: string;
  cleanliness?: string;
  work_mode?: string;
  pets?: string;
  roommate_gender?: string;
  [key: string]: string | undefined;
}

export interface TestUserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'seeker' | 'owner' | null;
  status: AccountStatus;
  city: string;
  localities: string[];
  budget: number;
  moveInDate: string;
  profession: string;
  company: string;
  bio?: string;
  age: number;
  gender: string;
  avatar: string;
  quizAnswers: QuizAnswers;
  onboardingComplete: boolean;
  isPremium: boolean;
  isVerified: boolean;
  phoneVerified?: boolean;
  workEmailVerified?: boolean;
  verificationLevel: number;
  connectsUsed: number;
  connectsLimit: number;
  savedProfileIds: string[];
  savedRoomIds: string[];
  skippedUserIds: string[];
  blockedUserIds: string[];
  isDemo?: boolean;
  isTest?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface TestListing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  city: string;
  locality: string;
  address: string;
  totalRent: number;
  partnerShare: number;
  deposit: number;
  availableFrom: string;
  flatType: string;
  furnishing: string;
  amenities: string[];
  houseRules: string[];
  preferredGender: string;
  status: ListingStatus;
  ownerVerified: boolean;
  views: number;
  lastConfirmedAt?: any;
  isTest?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface TestConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  listingId?: string;
  screeningAnswers?: Record<string, any>;
  isTest?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface TestChatRoom {
  id: string;
  participants: [string, string];
  connectionId: string;
  lastMessage: string;
  lastMessageAt?: any;
  lastMessageSenderId: string;
  isTest?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface TestChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  read: boolean;
  isTest?: boolean;
  createdAt?: any;
}

export interface TestReport {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'user' | 'listing';
  reason: string;
  status: ReportStatus;
  details?: string;
  isTest?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface TestOwnerVerification {
  id: string;
  userId: string;
  declaredName: string;
  documentType: 'aadhaar' | 'electricity_bill' | 'property_tax' | 'sale_deed' | 'rent_agreement';
  documentUrl: string;
  status: OwnerVerificationStatus;
  submittedAt?: any;
  reviewedAt?: any;
  reviewNote?: string;
  resubmissionCount?: number;
  isTest?: boolean;
}

export interface TestNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  isTest?: boolean;
  createdAt?: any;
}


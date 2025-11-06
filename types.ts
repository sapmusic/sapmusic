export type AgreementStatus = 'active' | 'pending' | 'expired' | 'rejected';
export type Role = 'admin' | 'user';
export type UserStatus = 'active' | 'deactivated';
export type SyncStatus = 'none' | 'pending' | 'active' | 'rejected';
export type DealStatus = 'offered' | 'accepted' | 'rejected' | 'expired';


export type PayPalDetails = {
  method: 'paypal';
  email: string;
};

export type BankDetails = {
  method: 'bank';
  accountHolderName: string;
  bankName: string;
  swiftBic: string;
  accountNumberIban: string;
  country: string;
};


export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  payoutMethod?: PayPalDetails | BankDetails;
  hasProfile?: boolean;
}

export interface Writer {
  id: string;
  writerId?: string; // Link to ManagedWriter ID
  name: string;
  role: string[];
  split: number;
  agreed: boolean;
  collectOnBehalf: boolean;
  dob?: string;
  society?: string;
  ipi: string;
}

export interface ManagedWriter {
  id: string;
  userId: string;
  name: string;
  dob: string;
  society: string;
  ipi: string;
}

export interface SpotifySong {
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  writers: { name: string; role: string }[];
  duration?: string;
  isrc?: string;
  upc?: string;
}

export const RevenueSources = ['mechanical', 'performance', 'sync', 'neighboring_rights'] as const;
export type RevenueSource = typeof RevenueSources[number];

export const Platforms = ['spotify', 'apple_music', 'youtube', 'other'] as const;
export type Platform = typeof Platforms[number];

export interface Earning {
    id: string;
    songId: string;
    amount: number;
    platform: Platform;
    source: RevenueSource;
    earningDate: string;
}

export type PayoutStatus = 'pending' | 'approved' | 'paid';

export interface PayoutRequest {
    id: string;
    userId: string;
    amount: number;
    requestDate: string;
    status: PayoutStatus;
}


export interface RegisteredSong {
  id: string;
  userId: string; // ID of the user who registered it
  title: string;
  artist: string;
  artworkUrl: string;
  registrationDate: string;
  writers: Writer[];
  signatureData: string;
  signatureType?: 'draw' | 'type';
  status: AgreementStatus;
  syncStatus: SyncStatus;
  agreementText: string;
  duration?: string;
  isrc?: string;
  upc?: string;
}

export interface SyncDeal {
    id: string;
    songId: string;
    dealType: string;
    licensee: string;
    fee: number;
    terms: string;
    status: DealStatus;
    offerDate: string;
    expiryDate: string;
}

export interface RoleDefinition {
  id: Role;
  name: string;
  description: string;
  permissions: {
    canViewAgreements: boolean;
    canRegisterSongs: boolean;
    canManageUsers: boolean;
    canApproveSongs: boolean;
    canManageEarnings: boolean;
    canManagePayouts: boolean;
  };
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string; // user.id, 'admin', or 'gemini-assistant'
  senderName: string;
  text: string;
  timestamp: string;
  groundingChunks?: any[];
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  isReadByAdmin: boolean;
}
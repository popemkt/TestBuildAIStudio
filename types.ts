export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum SplitType {
  EQUAL = 'EQUAL',
  EXACT = 'EXACT',
  PARTS = 'PARTS',
}

export interface SplitDetail {
  userId: string;
  amount: number; // in group's master currency
  parts?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  /** The final amount of the expense, ALWAYS converted to the group's master currency for consistent calculations. */
  amount: number;
  /** The amount as it was originally entered (e.g., 10000 for 10,000 JPY). */
  originalAmount: number;
  /** The 3-letter ISO code of the original currency (e.g., 'USD', 'EUR', 'JPY'). */
  originalCurrency: string;
  /** The exchange rate used to convert from originalCurrency to the group's masterCurrency. Null if they are the same. */
  conversionRate: number | null;
  paidBy: string; // userId
  participants: SplitDetail[];
  splitType: SplitType;
  date: string; // ISO string
  tags: string[];
  attachments?: string[];
  transactionType: TransactionType;
  location?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // Changed to string array of user IDs for Firestore
  imageUrl: string;
  masterCurrency: string; // e.g., 'USD', 'EUR'
}

export interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  theme: 'light' | 'dark';
  isDemoMode: boolean;
}

// Kept for potential future use or reference, but no longer drives the app state.
export type Action =
  | { type: 'LOGIN'; payload: { user: User } }
  | { type: 'LOGOUT' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' };

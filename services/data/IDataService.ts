import { User, Group, Expense } from '../../types';

/**
 * Defines the contract for any data service implementation.
 * This ensures that the application can seamlessly switch between different
 * backends (e.g., Firebase, demo data, Supabase) without changing core logic.
 */
export interface IDataService {
  // --- Initialization & Mode ---
  getMode(): 'firebase' | 'demo' | 'uninitialized';

  // --- Authentication ---
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;

  // --- Data Fetching (Optimized for React Query) ---
  getAllUsers(): Promise<User[]>;
  getDashboardData(
    userId: string
  ): Promise<{ groups: Group[]; expenses: Expense[] }>;
  getGroupDetails(
    groupId: string
  ): Promise<{ group: Group; expenses: Expense[]; users: User[] }>;
  getExpenseById(expenseId: string): Promise<Expense>;

  // --- Group Operations ---
  addGroup(groupData: Omit<Group, 'id'>): Promise<Group>;
  editGroup(group: Group): Promise<Group>;
  deleteGroup(groupId: string): Promise<void>;

  // --- Expense Operations ---
  addExpense(
    expenseData: Omit<Expense, 'id'>,
    newAttachments: string[]
  ): Promise<Expense>;
  editExpense(
    expense: Expense,
    newAttachments: string[],
    removedAttachments: string[]
  ): Promise<Expense>;
  deleteExpense(expenseId: string): Promise<void>;

  // --- Group Invite Operations ---
  createGroupInvite(groupId: string): Promise<string>; // returns invite code
  getInvite(inviteCode: string): Promise<{ groupId: string } | null>;
  addUserToGroup(groupId: string, userId: string): Promise<void>;
}

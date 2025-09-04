import { IDataService } from './IDataService';
import { FirebaseDataService } from './FirebaseDataService';
import { DemoDataService } from './DemoDataService';
import { isFirebaseConfigured } from '../firebaseService';
import { User, Group, Expense } from '../../types';

class DataServiceFacade implements IDataService {
  private static instance: DataServiceFacade;
  private activeService: IDataService | null = null;
  private mode: 'firebase' | 'demo' | 'uninitialized' = 'uninitialized';

  private authListenerCallback: ((user: User | null) => void) | null = null;
  private authUnsubscribe: () => void = () => {};

  private constructor() {}

  public static getInstance(): DataServiceFacade {
    if (!DataServiceFacade.instance) {
      DataServiceFacade.instance = new DataServiceFacade();
    }
    return DataServiceFacade.instance;
  }

  public initialize(mode: 'demo' | 'firebase'): void {
    // 1. Clean up any existing listener on the old service.
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }

    // 2. Set the new active service.
    if (mode === 'firebase' && isFirebaseConfigured) {
      this.activeService = new FirebaseDataService();
      this.mode = 'firebase';
    } else {
      this.activeService = new DemoDataService();
      this.mode = 'demo';
    }

    // 3. If a listener callback was previously registered by a component (e.g., App.tsx),
    // re-attach it to the new service and store the new unsubscribe function.
    if (this.authListenerCallback) {
      this.authUnsubscribe = this.activeService.onAuthStateChanged(
        this.authListenerCallback
      );
    }
  }

  private getService(): IDataService {
    if (!this.activeService) {
      // Default initialization if accessed before an explicit call to `initialize`.
      this.initialize(isFirebaseConfigured ? 'firebase' : 'demo');
    }
    return this.activeService!;
  }

  // --- IDataService Implementation ---

  getMode = (): 'firebase' | 'demo' | 'uninitialized' => this.mode;

  onAuthStateChanged = (
    callback: (user: User | null) => void
  ): (() => void) => {
    // Store the app's central auth callback.
    this.authListenerCallback = callback;

    // Attach it to the current service and store the unsubscribe function.
    this.authUnsubscribe = this.getService().onAuthStateChanged(callback);

    // Return a function that will clean up everything when the app unmounts.
    return () => {
      if (this.authUnsubscribe) {
        this.authUnsubscribe();
      }
      this.authUnsubscribe = () => {};
      this.authListenerCallback = null;
    };
  };

  signInWithGoogle = (): Promise<User> => {
    return this.getService().signInWithGoogle();
  };

  signOut = (): Promise<void> => {
    return this.getService().signOut();
  };

  // FIX: Add missing methods from IDataService to satisfy screen components
  getAllUsers = (): Promise<User[]> => {
    return this.getService().getAllUsers();
  };

  getDashboardData = (
    userId: string
  ): Promise<{ groups: Group[]; expenses: Expense[] }> => {
    return this.getService().getDashboardData(userId);
  };

  getGroupDetails = (
    groupId: string
  ): Promise<{ group: Group; expenses: Expense[]; users: User[] }> => {
    return this.getService().getGroupDetails(groupId);
  };

  getExpenseById = (expenseId: string): Promise<Expense> => {
    return this.getService().getExpenseById(expenseId);
  };

  addGroup = (groupData: Omit<Group, 'id'>): Promise<Group> => {
    return this.getService().addGroup(groupData);
  };

  // FIX: Correct return type to match IDataService (Promise<Group> instead of Promise<void>)
  editGroup = (group: Group): Promise<Group> => {
    return this.getService().editGroup(group);
  };

  deleteGroup = (groupId: string): Promise<void> => {
    return this.getService().deleteGroup(groupId);
  };

  addExpense = (
    expenseData: Omit<Expense, 'id'>,
    newAttachments: string[]
  ): Promise<Expense> => {
    return this.getService().addExpense(expenseData, newAttachments);
  };

  // FIX: Correct return type to match IDataService (Promise<Expense> instead of Promise<void>)
  editExpense = (
    expense: Expense,
    newAttachments: string[],
    removedAttachments: string[]
  ): Promise<Expense> => {
    return this.getService().editExpense(
      expense,
      newAttachments,
      removedAttachments
    );
  };

  deleteExpense = (expenseId: string): Promise<void> => {
    return this.getService().deleteExpense(expenseId);
  };

  createGroupInvite = (groupId: string): Promise<string> => {
    return this.getService().createGroupInvite(groupId);
  };

  getInvite = (
    inviteCode: string
  ): Promise<{ groupId: string } | null> => {
    return this.getService().getInvite(inviteCode);
  };

  addUserToGroup = (groupId: string, userId: string): Promise<void> => {
    return this.getService().addUserToGroup(groupId, userId);
  };
}

export const dataService = DataServiceFacade.getInstance();

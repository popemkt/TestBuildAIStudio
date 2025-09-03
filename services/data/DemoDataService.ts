import { IDataService } from './IDataService';
import { User, Group, Expense, SplitType, TransactionType } from '../../types';

// --- DEMO DATA ---
const demoCurrentUser: User = {
  id: 'user_01',
  name: 'Alex Doe',
  avatarUrl: 'https://i.pravatar.cc/150?u=user_01',
  email: 'alex.doe@example.com',
};
const allDemoUsers: User[] = [
  demoCurrentUser,
  {
    id: 'user_02',
    name: 'Ben Smith',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_02',
    email: 'ben.smith@example.com',
  },
  {
    id: 'user_03',
    name: 'Casey Jones',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_03',
    email: 'casey.jones@example.com',
  },
  {
    id: 'user_04',
    name: 'Dana Scully',
    avatarUrl: 'https://i.pravatar.cc/150?u=user_04',
    email: 'dana.scully@example.com',
  },
];
const initialDemoGroups: Group[] = [
  {
    id: 'group_01',
    name: 'Hawaii Trip',
    members: allDemoUsers.map((u) => u.id),
    imageUrl: 'https://picsum.photos/seed/hawaii/400/200',
    masterCurrency: 'USD',
  },
  {
    id: 'group_02',
    name: 'Apartment Bills',
    members: ['user_01', 'user_03'],
    imageUrl: 'https://picsum.photos/seed/apartment/400/200',
    masterCurrency: 'CAD',
  },
];
const initialDemoExpenses: Expense[] = [
  {
    id: 'exp_01',
    groupId: 'group_01',
    description: 'Flight Tickets',
    amount: 1200.0,
    originalAmount: 1200.0,
    originalCurrency: 'USD',
    conversionRate: null,
    paidBy: 'user_01',
    participants: [
      { userId: 'user_01', amount: 300.0 },
      { userId: 'user_02', amount: 300.0 },
      { userId: 'user_03', amount: 300.0 },
      { userId: 'user_04', amount: 300.0 },
    ],
    splitType: SplitType.EQUAL,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    tags: ['travel', 'flights'],
    attachments: [],
    transactionType: TransactionType.EXPENSE,
  },
  {
    id: 'exp_02',
    groupId: 'group_01',
    description: "Dinner at Roy's",
    amount: 250.0,
    originalAmount: 250.0,
    originalCurrency: 'USD',
    conversionRate: null,
    paidBy: 'user_02',
    participants: [
      { userId: 'user_01', amount: 100.0 },
      { userId: 'user_02', amount: 50.0 },
      { userId: 'user_03', amount: 100.0 },
    ],
    splitType: SplitType.EXACT,
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    tags: ['food', 'dining'],
    attachments: ['https://picsum.photos/seed/receipt1/400/300'],
    transactionType: TransactionType.EXPENSE,
  },
  {
    id: 'exp_04',
    groupId: 'group_02',
    description: 'Monthly Rent',
    amount: 1500.0,
    originalAmount: 2055.0,
    originalCurrency: 'CAD',
    conversionRate: 0.73,
    paidBy: 'user_03',
    participants: [
      { userId: 'user_01', amount: 750.0 },
      { userId: 'user_03', amount: 750.0 },
    ],
    splitType: SplitType.EQUAL,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    tags: ['rent', 'housing'],
    attachments: [],
    transactionType: TransactionType.EXPENSE,
  },
];

interface DemoStorage {
  users: User[];
  groups: Group[];
  expenses: Expense[];
}

export class DemoDataService implements IDataService {
  private state: DemoStorage;
  private readonly DEMO_STORAGE_KEY = 'splitsmart_demo_data';
  private onAuthChangeCallback: ((user: User | null) => void) | null = null;

  constructor() {
    this.state = this.loadState();
  }

  getMode = (): 'firebase' | 'demo' | 'uninitialized' => 'demo';

  private loadState(): DemoStorage {
    try {
      const savedData = localStorage.getItem(this.DEMO_STORAGE_KEY);
      if (savedData) return JSON.parse(savedData);
    } catch (e) {
      console.error('Failed to parse demo data', e);
    }
    return {
      users: allDemoUsers,
      groups: initialDemoGroups,
      expenses: initialDemoExpenses,
    };
  }

  private saveState(): void {
    localStorage.setItem(this.DEMO_STORAGE_KEY, JSON.stringify(this.state));
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.onAuthChangeCallback = callback;
    if (localStorage.getItem(this.DEMO_STORAGE_KEY)) {
      callback(demoCurrentUser);
    } else {
      callback(null);
    }
    return () => {
      this.onAuthChangeCallback = null;
    };
  }

  async signInWithGoogle(): Promise<User> {
    this.state = this.loadState();
    this.saveState();
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(demoCurrentUser);
    return Promise.resolve(demoCurrentUser);
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.DEMO_STORAGE_KEY);
    this.state = { users: [], groups: [], expenses: [] };
    if (this.onAuthChangeCallback) this.onAuthChangeCallback(null);
    return Promise.resolve();
  }

  async getAllUsers(): Promise<User[]> {
    return Promise.resolve(this.state.users);
  }

  async getDashboardData(
    userId: string
  ): Promise<{ groups: Group[]; expenses: Expense[] }> {
    const groups = this.state.groups.filter((g) => g.members.includes(userId));
    const groupIds = groups.map((g) => g.id);
    const expenses = this.state.expenses.filter((e) =>
      groupIds.includes(e.groupId)
    );
    return Promise.resolve({ groups, expenses });
  }

  async getGroupDetails(
    groupId: string
  ): Promise<{ group: Group; expenses: Expense[]; users: User[] }> {
    const group = this.state.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Demo group not found');
    const expenses = this.state.expenses.filter((e) => e.groupId === groupId);
    const userIds = new Set(group.members);
    expenses.forEach((e) => {
      userIds.add(e.paidBy);
      e.participants.forEach((p) => userIds.add(p.userId));
    });
    const users = this.state.users.filter((u) => userIds.has(u.id));
    return Promise.resolve({ group, expenses, users });
  }

  async getExpenseById(expenseId: string): Promise<Expense> {
    const expense = this.state.expenses.find((e) => e.id === expenseId);
    if (!expense) throw new Error('Demo expense not found');
    return Promise.resolve(expense);
  }

  async addGroup(groupData: Omit<Group, 'id'>): Promise<Group> {
    const newGroup: Group = { ...groupData, id: `demo_group_${Date.now()}` };
    this.state.groups.push(newGroup);
    this.saveState();
    return Promise.resolve(newGroup);
  }

  async editGroup(group: Group): Promise<Group> {
    this.state.groups = this.state.groups.map((g) =>
      g.id === group.id ? group : g
    );
    this.saveState();
    return Promise.resolve(group);
  }

  async deleteGroup(groupId: string): Promise<void> {
    this.state.groups = this.state.groups.filter((g) => g.id !== groupId);
    this.state.expenses = this.state.expenses.filter(
      (e) => e.groupId !== groupId
    );
    this.saveState();
    return Promise.resolve();
  }

  async addExpense(
    expenseData: Omit<Expense, 'id'>,
    newAttachments: string[]
  ): Promise<Expense> {
    const newExpense: Expense = {
      ...expenseData,
      id: `demo_exp_${Date.now()}`,
      attachments: newAttachments,
      date: new Date(expenseData.date).toISOString(),
    };
    this.state.expenses.push(newExpense);
    this.saveState();
    return Promise.resolve(newExpense);
  }

  async editExpense(
    expense: Expense,
    newAttachments: string[],
    removedAttachments: string[]
  ): Promise<Expense> {
    const finalAttachments = [
      ...(expense.attachments || []).filter(
        (url) => !removedAttachments.includes(url)
      ),
      ...newAttachments,
    ];
    const finalExpense = { ...expense, attachments: finalAttachments };
    this.state.expenses = this.state.expenses.map((e) =>
      e.id === expense.id ? finalExpense : e
    );
    this.saveState();
    return Promise.resolve(finalExpense);
  }

  async deleteExpense(expenseId: string): Promise<void> {
    this.state.expenses = this.state.expenses.filter((e) => e.id !== expenseId);
    this.saveState();
    return Promise.resolve();
  }
}

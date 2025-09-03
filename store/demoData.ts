import { User, Group, Expense, TransactionType, SplitType } from '../types';

// --- DEMO USERS ---
export const demoCurrentUser: User = {
  id: 'user_01',
  name: 'Alex Doe',
  avatarUrl: 'https://i.pravatar.cc/150?u=user_01',
  email: 'alex.doe@example.com',
};

export const demoUsers: User[] = [
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

const allUserIds = demoUsers.map((u) => u.id);

// --- DEMO GROUPS ---
export const demoGroups: Group[] = [
  {
    id: 'group_01',
    name: 'Hawaii Trip',
    members: allUserIds,
    imageUrl: 'https://picsum.photos/seed/hawaii/400/200',
    masterCurrency: 'USD',
  },
  {
    id: 'group_02',
    name: 'Apartment Bills',
    members: ['user_01', 'user_03'], // Alex and Casey
    imageUrl: 'https://picsum.photos/seed/apartment/400/200',
    masterCurrency: 'CAD',
  },
];

// --- DEMO EXPENSES ---
export const demoExpenses: Expense[] = [
  // Expenses for Hawaii Trip (group_01)
  {
    id: 'exp_01',
    groupId: 'group_01',
    description: 'Flight Tickets',
    amount: 1200.0,
    originalAmount: 1200.0,
    originalCurrency: 'USD',
    conversionRate: null,
    paidBy: 'user_01', // Alex
    participants: [
      { userId: 'user_01', amount: 300.0 },
      { userId: 'user_02', amount: 300.0 },
      { userId: 'user_03', amount: 300.0 },
      { userId: 'user_04', amount: 300.0 },
    ],
    splitType: SplitType.EQUAL,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
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
    paidBy: 'user_02', // Ben
    participants: [
      { userId: 'user_01', amount: 100.0 },
      { userId: 'user_02', amount: 50.0 },
      { userId: 'user_03', amount: 100.0 },
    ],
    splitType: SplitType.EXACT,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    tags: ['food', 'dining'],
    attachments: ['https://picsum.photos/seed/receipt1/400/300'],
    transactionType: TransactionType.EXPENSE,
  },
  {
    id: 'exp_03',
    groupId: 'group_01',
    description: 'Snacks and Drinks',
    amount: 75.0,
    originalAmount: 75.0,
    originalCurrency: 'USD',
    conversionRate: null,
    paidBy: 'user_01', // Alex
    participants: [
      { userId: 'user_01', amount: 50.0, parts: 2 },
      { userId: 'user_03', amount: 25.0, parts: 1 },
    ],
    splitType: SplitType.PARTS,
    date: new Date().toISOString(), // Today
    tags: ['groceries', 'snacks'],
    attachments: [],
    transactionType: TransactionType.EXPENSE,
  },
  // Expenses for Apartment Bills (group_02)
  {
    id: 'exp_04',
    groupId: 'group_02',
    description: 'Monthly Rent',
    amount: 1500.0,
    originalAmount: 2055.0,
    originalCurrency: 'CAD',
    conversionRate: 0.73, // Mock rate
    paidBy: 'user_03', // Casey
    participants: [
      { userId: 'user_01', amount: 750.0 },
      { userId: 'user_03', amount: 750.0 },
    ],
    splitType: SplitType.EQUAL,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    tags: ['rent', 'housing'],
    attachments: [],
    transactionType: TransactionType.EXPENSE,
  },
  {
    id: 'exp_05',
    groupId: 'group_02',
    description: 'Internet Bill',
    amount: 60.0,
    originalAmount: 82.2,
    originalCurrency: 'CAD',
    conversionRate: 0.73,
    paidBy: 'user_01', // Alex
    participants: [
      { userId: 'user_01', amount: 30.0 },
      { userId: 'user_03', amount: 30.0 },
    ],
    splitType: SplitType.EQUAL,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    tags: ['utilities', 'internet'],
    attachments: [],
    transactionType: TransactionType.EXPENSE,
  },
];

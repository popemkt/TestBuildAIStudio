import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseService';
import { Group, Expense, User } from '../types';

// --- DATA CONVERSION HELPERS ---
const fromFirestore = (docData: any): any => {
  const data = { ...docData, id: docData.id };
  // Convert Firestore Timestamps to ISO strings for consistent date handling in the app
  if (data.date && data.date instanceof Timestamp) {
    data.date = data.date.toDate().toISOString();
  }
  return data;
};
const toFirestore = (data: any): any => {
  const firestoreData = { ...data };
  // Convert ISO strings back to Firestore Timestamps before writing to the database
  if (firestoreData.date && typeof firestoreData.date === 'string') {
    firestoreData.date = Timestamp.fromDate(new Date(firestoreData.date));
  }
  // The 'id' is managed by Firestore documents, so we don't store it inside the document data.
  delete firestoreData.id;
  return firestoreData;
};

/**
 * A dedicated service for all Firestore database operations.
 */
export const databaseService = {
  getGroupsForUser: async (userId: string): Promise<Group[]> => {
    if (!isFirebaseConfigured) return [];
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Group);
  },
  getExpensesForGroups: async (groupIds: string[]): Promise<Expense[]> => {
    if (!isFirebaseConfigured || groupIds.length === 0) return [];
    // Firestore 'in' queries are limited to 30 items. This handles larger sets by chunking.
    const chunks = [];
    for (let i = 0; i < groupIds.length; i += 30) {
      chunks.push(groupIds.slice(i, i + 30));
    }
    const promises = chunks.map((chunk) =>
      getDocs(query(collection(db, 'expenses'), where('groupId', 'in', chunk)))
    );
    const snapshots = await Promise.all(promises);
    return snapshots.flatMap((snapshot) =>
      snapshot.docs.map(
        (doc) => fromFirestore({ id: doc.id, ...doc.data() }) as Expense
      )
    );
  },
  getUsersByIds: async (userIds: string[]): Promise<User[]> => {
    if (!isFirebaseConfigured || userIds.length === 0) return [];
    const uniqueIds = [...new Set(userIds)];
    // Firestore 'in' queries are limited to 30 items. This handles larger sets by chunking.
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
      chunks.push(uniqueIds.slice(i, i + 30));
    }
    // '__name__' is the document ID field in Firestore queries
    const promises = chunks.map((chunk) =>
      getDocs(query(collection(db, 'users'), where('__name__', 'in', chunk)))
    );
    const snapshots = await Promise.all(promises);
    return snapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
    );
  },
  addGroup: async (group: Omit<Group, 'id'>): Promise<string> => {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured.');
    const docRef = await addDoc(collection(db, 'groups'), group);
    return docRef.id;
  },
  editGroup: async (group: Group): Promise<void> => {
    if (!isFirebaseConfigured) return;
    await setDoc(doc(db, 'groups', group.id), toFirestore(group));
  },
  deleteGroup: async (groupId: string): Promise<void> => {
    if (!isFirebaseConfigured) return;
    const batch = writeBatch(db);
    // Delete the group document
    batch.delete(doc(db, 'groups', groupId));
    // Find and delete all associated expenses
    const expensesSnapshot = await getDocs(
      query(collection(db, 'expenses'), where('groupId', '==', groupId))
    );
    expensesSnapshot.forEach((expenseDoc) => batch.delete(expenseDoc.ref));
    await batch.commit();
  },
  addExpense: async (expense: Omit<Expense, 'id'>): Promise<string> => {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured.');
    const docRef = await addDoc(
      collection(db, 'expenses'),
      toFirestore(expense)
    );
    return docRef.id;
  },
  editExpense: async (expense: Expense): Promise<void> => {
    if (!isFirebaseConfigured) return;
    await setDoc(doc(db, 'expenses', expense.id), toFirestore(expense));
  },
  deleteExpense: async (expenseId: string): Promise<void> => {
    if (!isFirebaseConfigured) return;
    await deleteDoc(doc(db, 'expenses', expenseId));
  },
};

import { IDataService } from './IDataService';
import { User, Group, Expense } from '../../types';
import { auth, db, storage, isFirebaseConfigured } from '../firebaseService';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// --- Data Conversion Helpers ---
const fromFirestore = (doc: any, id: string): any => {
  const data = { ...doc.data(), id };
  if (data.date && data.date instanceof Timestamp) {
    data.date = data.date.toDate().toISOString();
  }
  return data;
};
const toFirestore = (data: any): any => {
  const firestoreData = { ...data };
  if (firestoreData.date && typeof firestoreData.date === 'string') {
    firestoreData.date = Timestamp.fromDate(new Date(firestoreData.date));
  }
  delete firestoreData.id;
  return firestoreData;
};

export class FirebaseDataService implements IDataService {
  getMode = (): 'firebase' | 'demo' | 'uninitialized' => 'firebase';

  // --- Authentication ---
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!isFirebaseConfigured) return () => {};
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = await this.getOrCreateUser(firebaseUser);
        callback(appUser);
      } else {
        callback(null);
      }
    });
  }

  async signInWithGoogle(): Promise<User> {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured.');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return await this.getOrCreateUser(result.user);
  }

  async signOut(): Promise<void> {
    if (isFirebaseConfigured) await signOut(auth);
  }

  private async getOrCreateUser(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists())
      return { id: userSnap.id, ...userSnap.data() } as User;

    const newUser: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Anonymous',
      avatarUrl:
        firebaseUser.photoURL ||
        `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
      email: firebaseUser.email || '',
    };
    await setDoc(userRef, newUser);
    return newUser;
  }

  // --- Data Fetching ---
  async getAllUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as User);
  }

  async getDashboardData(
    userId: string
  ): Promise<{ groups: Group[]; expenses: Expense[] }> {
    const groups = await this.getGroupsForUser(userId);
    const groupIds = groups.map((g) => g.id);
    const expenses =
      groupIds.length > 0 ? await this.getExpensesForGroups(groupIds) : [];
    return { groups, expenses };
  }

  async getGroupDetails(
    groupId: string
  ): Promise<{ group: Group; expenses: Expense[]; users: User[] }> {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error('Group not found');

    const group = { id: groupSnap.id, ...groupSnap.data() } as Group;
    const expenses = await this.getExpensesForGroups([groupId]);

    const userIds = new Set(group.members);
    expenses.forEach((expense) => {
      userIds.add(expense.paidBy);
      expense.participants.forEach((p) => userIds.add(p.userId));
    });

    const users = await this.getUsersByIds(Array.from(userIds));
    return { group, expenses, users };
  }

  async getExpenseById(expenseId: string): Promise<Expense> {
    const docRef = doc(db, 'expenses', expenseId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Expense not found');
    return fromFirestore(docSnap, docSnap.id) as Expense;
  }

  private async getGroupsForUser(userId: string): Promise<Group[]> {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Group);
  }

  private async getExpensesForGroups(groupIds: string[]): Promise<Expense[]> {
    if (groupIds.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < groupIds.length; i += 30) {
      chunks.push(groupIds.slice(i, i + 30));
    }
    const promises = chunks.map((chunk) =>
      getDocs(query(collection(db, 'expenses'), where('groupId', 'in', chunk)))
    );
    const snapshots = await Promise.all(promises);
    return snapshots.flatMap((s) =>
      s.docs.map((d) => fromFirestore(d, d.id) as Expense)
    );
  }

  private async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];
    const uniqueIds = [...new Set(userIds)];
    const chunks = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
      chunks.push(uniqueIds.slice(i, i + 30));
    }
    const promises = chunks.map((chunk) =>
      getDocs(query(collection(db, 'users'), where('__name__', 'in', chunk)))
    );
    const snapshots = await Promise.all(promises);
    return snapshots.flatMap((s) =>
      s.docs.map((d) => ({ id: d.id, ...d.data() }) as User)
    );
  }

  // --- Group Operations ---
  async addGroup(groupData: Omit<Group, 'id'>): Promise<Group> {
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return { ...groupData, id: docRef.id };
  }

  async editGroup(group: Group): Promise<Group> {
    await setDoc(doc(db, 'groups', group.id), toFirestore(group));
    return group;
  }

  async deleteGroup(groupId: string): Promise<void> {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'groups', groupId));
    const expensesSnapshot = await getDocs(
      query(collection(db, 'expenses'), where('groupId', '==', groupId))
    );
    expensesSnapshot.forEach((expenseDoc) => batch.delete(expenseDoc.ref));
    await batch.commit();
  }

  // --- Expense Operations ---
  async addExpense(
    expenseData: Omit<Expense, 'id'>,
    newAttachments: string[]
  ): Promise<Expense> {
    const attachmentUrls = await Promise.all(
      newAttachments.map((base64) =>
        this.uploadImage(base64, `expenses/${expenseData.groupId}`)
      )
    );
    const finalExpenseData = { ...expenseData, attachments: attachmentUrls };
    const docRef = await addDoc(
      collection(db, 'expenses'),
      toFirestore(finalExpenseData)
    );
    return {
      ...finalExpenseData,
      id: docRef.id,
      date: new Date(finalExpenseData.date).toISOString(),
    };
  }

  async editExpense(
    expense: Expense,
    newAttachments: string[],
    removedAttachments: string[]
  ): Promise<Expense> {
    await Promise.all(removedAttachments.map((url) => this.deleteImage(url)));
    const newAttachmentUrls = await Promise.all(
      newAttachments.map((base64) =>
        this.uploadImage(base64, `expenses/${expense.groupId}`)
      )
    );
    const finalAttachments = [
      ...(expense.attachments || []).filter(
        (url) => !removedAttachments.includes(url)
      ),
      ...newAttachmentUrls,
    ];
    const finalExpense = { ...expense, attachments: finalAttachments };
    await setDoc(doc(db, 'expenses', expense.id), toFirestore(finalExpense));
    return finalExpense;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const expenseToDelete = await this.getExpenseById(expenseId);
    if (expenseToDelete?.attachments?.length) {
      await Promise.all(
        expenseToDelete.attachments.map((url) => this.deleteImage(url))
      );
    }
    await deleteDoc(doc(db, 'expenses', expenseId));
  }
  
  // --- Invite Operations ---
  async createGroupInvite(groupId: string): Promise<string> {
    const docRef = await addDoc(collection(db, 'invites'), {
      groupId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async getInvite(
    inviteCode: string
  ): Promise<{ groupId: string } | null> {
    const docRef = doc(db, 'invites', inviteCode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { groupId: string };
    }
    return null;
  }
  
  async addUserToGroup(groupId: string, userId: string): Promise<void> {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
    });
  }

  // --- Storage Helpers ---
  private async uploadImage(
    base64DataUrl: string,
    path: string
  ): Promise<string> {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    await uploadString(storageRef, base64DataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  }

  private async deleteImage(downloadUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, downloadUrl);
      await deleteObject(storageRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found')
        console.error('Error deleting image:', error);
    }
  }
}

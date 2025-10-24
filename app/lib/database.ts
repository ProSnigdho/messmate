import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Meal, Expense, Grocery, Notice, UserProfile, Mess } from "./types";

const isTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === "function";
};

const convertDocToData = (doc: any): any => {
  const data = doc.data();

  const convertedData = {
    ...data,
    id: doc.id,
    date: isTimestamp(data.date) ? data.date.toDate() : data.date,
    createdAt: isTimestamp(data.createdAt)
      ? data.createdAt.toDate()
      : data.createdAt,
    joinDate: isTimestamp(data.joinDate)
      ? data.joinDate.toDate()
      : data.joinDate,
    purchasedAt: isTimestamp(data.purchasedAt)
      ? data.purchasedAt.toDate()
      : data.purchasedAt,
    settings: data.settings
      ? {
          ...data.settings,
          createdAt: isTimestamp(data.settings.createdAt)
            ? data.settings.createdAt.toDate()
            : data.settings.createdAt,
        }
      : data.settings,
  };

  return convertedData;
};

const mapSnapshotToData = (snapshot: QuerySnapshot): any[] => {
  return snapshot.docs.map(convertDocToData);
};

export const addMeal = async (
  mealData: Omit<Meal, "id" | "createdAt">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "meals"), {
    ...mealData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getTodayMeals = async (
  messId: string,
  date: string
): Promise<Meal[]> => {
  const q = query(
    collection(db, "meals"),
    where("messId", "==", messId),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  return mapSnapshotToData(snapshot) as Meal[];
};

export const updateMeal = async (
  mealId: string,
  updates: Partial<Meal>
): Promise<void> => {
  const mealRef = doc(db, "meals", mealId);
  const firestoreUpdates = { ...updates };
  if (firestoreUpdates.createdAt instanceof Date) {
    firestoreUpdates.createdAt = Timestamp.fromDate(firestoreUpdates.createdAt);
  }
  await updateDoc(mealRef, firestoreUpdates as { [key: string]: any });
};

export const addExpense = async (
  expenseData: Omit<Expense, "id" | "date">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "expenses"), {
    ...expenseData,
    date: Timestamp.now(),
  });
  return docRef.id;
};

export const getMonthlyExpenses = async (
  messId: string,
  month: number,
  year: number
): Promise<Expense[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const q = query(
    collection(db, "expenses"),
    where("messId", "==", messId),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate)),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  return mapSnapshotToData(snapshot) as Expense[];
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  await deleteDoc(doc(db, "expenses", expenseId));
};

export const addGrocery = async (
  groceryData: Omit<Grocery, "id" | "createdAt" | "status">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "groceries"), {
    ...groceryData,
    status: "pending",
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getPendingGroceryList = async (
  messId: string
): Promise<Grocery[]> => {
  const q = query(
    collection(db, "groceries"),
    where("messId", "==", messId),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  return mapSnapshotToData(snapshot) as Grocery[];
};

export const updateGroceryStatus = async (
  groceryId: string,
  status: "pending" | "bought"
): Promise<void> => {
  const groceryRef = doc(db, "groceries", groceryId);
  await updateDoc(groceryRef, { status: status });
};

export const addNotice = async (
  noticeData: Omit<Notice, "id" | "createdAt">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "notices"), {
    ...noticeData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getNotices = async (messId: string): Promise<Notice[]> => {
  const q = query(
    collection(db, "notices"),
    where("messId", "==", messId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return mapSnapshotToData(snapshot) as Notice[];
};

export const getMessMembers = async (
  messId: string
): Promise<UserProfile[]> => {
  const q = query(
    collection(db, "users"),
    where("messId", "==", messId),
    orderBy("displayName", "asc")
  );

  const snapshot = await getDocs(q);
  const members = mapSnapshotToData(snapshot) as any[];

  return members.map((member) => ({
    ...member,
    uid: member.id,
  })) as UserProfile[];
};

export const updateMemberRole = async (
  memberUid: string,
  newRole: "manager" | "member"
): Promise<void> => {
  const userRef = doc(db, "users", memberUid);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: Timestamp.now(),
  });
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const getMessById = async (messId: string): Promise<Mess | null> => {
  const messDoc = await getDoc(doc(db, "messes", messId));
  if (!messDoc.exists()) return null;
  return convertDocToData(messDoc) as Mess;
};

export const updateMessSettings = async (
  messId: string,
  settings: Partial<Mess["settings"]>
): Promise<void> => {
  const messRef = doc(db, "messes", messId);
  await updateDoc(messRef, {
    "settings.mealRate": settings.mealRate,
    "settings.currency": settings.currency,
  });
};

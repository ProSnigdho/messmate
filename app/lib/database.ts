// app/lib/database.ts (Final Fixed)

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
import { db } from "./firebase"; // নিশ্চিত করুন এই পাথটি সঠিক
// ✅ FIX 1: User টাইপ UserProfile এ পরিবর্তন হতে পারে, যদি types.ts এ এটি থাকে, তবে এখানে User ধরে নেওয়া হলো
import { Meal, Expense, Grocery, Notice, UserProfile, Mess } from "./types";

// --- Helper Functions ---

const isTimestamp = (value: any): value is Timestamp => {
  return value && typeof value.toDate === "function";
};

// এই ফাংশনটি এখন শুধুমাত্র ID যোগ করে এবং Timestamp থেকে Date এ রূপান্তর করে
const convertDocToData = (doc: any): any => {
  const data = doc.data();

  // ✅ FIX 2: সমস্ত সম্ভাব্য Timestamp fields রূপান্তর করা হলো
  const convertedData = {
    ...data,
    id: doc.id,

    // Date conversions (based on your types.ts using Date/Timestamp)
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

    // Nested field in Mess
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

// ✅ mapSnapshotToData এখন শুধু convertDocToData কল করবে
const mapSnapshotToData = (snapshot: QuerySnapshot): any[] => {
  return snapshot.docs.map(convertDocToData);
};

// 🍚 Meal Functions -----------------------------------------------------

export const addMeal = async (
  mealData: Omit<Meal, "id" | "createdAt">
): Promise<string> => {
  // ✅ FIX 3: createdAt কে Timestamp এ রূপান্তর
  const docRef = await addDoc(collection(db, "meals"), {
    ...mealData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getTodayMeals = async (
  messId: string,
  date: string // YYYY-MM-DD format
): Promise<Meal[]> => {
  const q = query(
    collection(db, "meals"),
    where("messId", "==", messId),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  // ✅ FIX 4: mapSnapshotToData ব্যবহার
  return mapSnapshotToData(snapshot) as Meal[];
};

export const updateMeal = async (
  mealId: string,
  updates: Partial<Meal>
): Promise<void> => {
  const mealRef = doc(db, "meals", mealId);

  // ✅ FIX 5: ডেটাবেসে পাঠানোর আগে Date অবজেক্টকে Timestamp এ রূপান্তর করা হলো (যদি updates এ থাকে)
  const firestoreUpdates = { ...updates };
  if (firestoreUpdates.createdAt instanceof Date) {
    firestoreUpdates.createdAt = Timestamp.fromDate(firestoreUpdates.createdAt);
  }

  await updateDoc(mealRef, firestoreUpdates as { [key: string]: any });
};

// 💰 Expense Functions -----------------------------------------------------

export const addExpense = async (
  expenseData: Omit<Expense, "id" | "date">
): Promise<string> => {
  // ✅ FIX 6: date কে Timestamp এ রূপান্তর
  const docRef = await addDoc(collection(db, "expenses"), {
    ...expenseData,
    date: Timestamp.now(),
  });
  return docRef.id;
};

export const getMonthlyExpenses = async (
  messId: string,
  month: number, // 1-12
  year: number
): Promise<Expense[]> => {
  const startDate = new Date(year, month - 1, 1);
  // মাস শেষ হবার দিন ও সময় (মাস্কিং এর জন্য)
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

// 🛒 Grocery Functions -----------------------------------------------------

export const addGrocery = async (
  groceryData: Omit<Grocery, "id" | "createdAt" | "status">
): Promise<string> => {
  // ✅ FIX 7: createdAt কে Timestamp এ রূপান্তর
  const docRef = await addDoc(collection(db, "groceries"), {
    ...groceryData,
    status: "pending", // Default status
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

// 📢 Notice Functions -----------------------------------------------------

export const addNotice = async (
  noticeData: Omit<Notice, "id" | "createdAt">
): Promise<string> => {
  // ✅ FIX 8: createdAt কে Timestamp এ রূপান্তর
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

// 👥 User/Member Functions ------------------------------------------------

export const getMessMembers = async (
  messId: string
): Promise<UserProfile[]> => {
  const q = query(
    collection(db, "users"),
    where("messId", "==", messId),
    orderBy("displayName", "asc")
  );

  const snapshot = await getDocs(q);
  // ✅ FIX 9: mapSnapshotToData ব্যবহার করে ডেটা রূপান্তর (helper function এখন joinDate হ্যান্ডেল করে)
  return mapSnapshotToData(snapshot) as UserProfile[];
};

// 🏠 Mess Info Functions ---------------------------------------------------

export const getMessById = async (messId: string): Promise<Mess | null> => {
  const messDoc = await getDoc(doc(db, "messes", messId));
  if (!messDoc.exists()) return null;

  // ✅ FIX 10: convertDocToData ব্যবহার করে ডেটা রূপান্তর (helper function এখন createdAt হ্যান্ডেল করে)
  return convertDocToData(messDoc) as Mess;
};

export const updateMessSettings = async (
  messId: string,
  settings: Partial<Mess["settings"]>
): Promise<void> => {
  const messRef = doc(db, "messes", messId);
  // Firestore-এ nested fields আপডেট করার জন্য dot notation ব্যবহার করা ভালো
  await updateDoc(messRef, {
    "settings.mealRate": settings.mealRate,
    "settings.currency": settings.currency,
    // ... any other settings
  });
};

import { Timestamp } from "firebase/firestore";

// --- Utility Types ---
// Firestore-এ নতুন ডকুমেন্ট যুক্ত করার সময় id ছাড়া বাকি প্রপার্টিগুলো ব্যবহার করতে
export type WithId<T> = T & { id: string };
export type WithoutId<T> = Omit<T, "id">;

// --- 1. Mess Management Types ---
export interface Mess {
  id: string;
  name: string;
  code: string;
  createdBy: string; // User UID of the creator
  createdAt: Timestamp; // Firestore best practice
  members: string[]; // User UIDs
  settings: {
    mealRate: number;
    currency: string;
    maxMembers?: number; // Optional
  };
}

// --- 2. User Profile Type ---
// এই ডেটাটি users কালেকশনে সেভ হবে
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "manager" | "member";
  messId?: string; // current mess ID
  phone?: string;
  joinDate: Timestamp; // Firestore best practice
}

// --- 3. Core Mess Activity Types ---

export interface Meal {
  id: string;
  messId: string;
  userId: string;
  userName: string | null; // Added for easy display in tables

  date: string; // YYYY-MM-DD format (Remains string for querying)

  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;

  createdAt: Timestamp; // Firestore best practice
}

// --- 4. Expense Interface ---

// 🔥 FIX: ExpenseCategory Type updated to correctly include 'utility', 'grocery', and 'meal'
export type ExpenseCategory =
  | "utility" // Used for overhead/rent in ExpenseManager
  | "grocery" // Used for meal purchases in useGroceryHistory
  | "meal" // Used for comparison in useBalanceSheetData
  | "others"
  | "general";

export interface Expense {
  id: string;
  messId: string;

  // --- Payer Details (Who paid the money) ---
  paidBy: string; // User UID of the payer (Used in the hook logic)
  paidByName: string; // Display name of the payer (Used in the hook logic)

  // --- Expense Details ---
  title: string; // Short summary (e.g., "Grocery run")
  amount: number;
  category: ExpenseCategory; // Uses the updated type
  date: Timestamp;
  description?: string; // Optional detailed description
}

// --- 5. Deposit Interface ---
export interface Deposit {
  id: string;
  messId: string;

  // ✅ FIX: Huk-এর প্রয়োজনীয় প্রপার্টি
  userId: string;
  userName: string | null;
  // ---

  amount: number;
  date: Timestamp;
  method?: string; // e.g., "Cash", "Bkash"
  comment?: string;
  category: string;
  description: string;
}

// --- 6. Grocery/Shopping List ---
export interface Grocery {
  id: string;
  messId: string;
  name: string;
  quantity: string;
  addedBy: string; // User UID
  status: "pending" | "bought";
  createdAt: Timestamp; // Firestore best practice

  purchasedBy?: string; // User UID of the purchaser
  purchasedAt?: Timestamp;
}

// --- 7. Notice Board ---
export interface Notice {
  id: string;
  messId: string;
  title: string;
  content: string;
  postedBy: string;
  createdAt: Timestamp; // Firestore best practice
  priority: "low" | "medium" | "high";
}

// --- 8. Dashboard Overview Type ---
// useOverviewData হুক থেকে প্রাপ্ত অ্যাগ্রিগেটেড ডেটা
export interface OverviewStats {
  currentMonth: string;
  mealRate: number;
  totalMeals: number;
  totalExpenses: number;
  totalDeposits: number;

  members: UserProfile[];
  memberBalances: Record<string, number>; // UID -> Balance
}

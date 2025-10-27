import { Timestamp } from "firebase/firestore";

export type WithId<T> = T & { id: string };
export type WithoutId<T> = Omit<T, "id">;

export interface Mess {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: Timestamp;
  members: string[];
  settings: {
    mealRate: number;
    currency: string;
    maxMembers?: number;
    defaultRent?: number;
  };
}

export interface UserProfile {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  messId: string | null;
  role: "manager" | "member" | "pending";
  createdAt?: Date;
  updatedAt?: Date;
  photoURL?: string;
  phoneNumber?: string;
  monthlyRent?: number;
  customRent?: number;
  totalRent?: number;
  emailVerified?: boolean;
}

export interface Meal {
  id: string;
  messId: string;
  userId: string;
  userName: string | null;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  createdAt: Timestamp;
}

export type ExpenseCategory =
  | "utility"
  | "grocery"
  | "meal"
  | "others"
  | "general"
  | "gas"
  | "internet"
  | "electricity"
  | "water"
  | "cleaner"
  | "other_bills";

export interface Expense {
  id: string;
  messId: string;
  paidBy: string;
  paidByName: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  description?: string;
  dividedAmount?: number;
  totalMembers?: number;
}

export type DepositCategory =
  | "rent"
  | "utility_contribution"
  | "gas_contribution"
  | "internet_contribution"
  | "electricity_contribution"
  | "water_contribution"
  | "cleaner_contribution"
  | "other_bills_contribution";

export interface Deposit {
  id: string;
  messId: string;
  userId: string;
  userName: string | null;
  amount: number;
  date: Timestamp;
  method?: string;
  comment?: string;
  category: DepositCategory;
  description: string;
  month?: string;
  isRentPaid?: boolean;
  rentMonth?: string;
  relatedExpenseId?: string;
}

export interface Grocery {
  id: string;
  messId: string;
  name: string;
  quantity: string;
  addedBy: string;
  status: "pending" | "bought";
  createdAt: Timestamp;
  purchasedBy?: string;
  purchasedAt?: Timestamp;
}

export interface Notice {
  id: string;
  messId: string;
  title: string;
  content: string;
  postedBy: string;
  createdAt: Timestamp;
  priority: "low" | "medium" | "high";
}

export interface OverviewStats {
  currentMonth: string;
  mealRate: number;
  totalMeals: number;
  totalExpenses: number;
  totalDeposits: number;
  members: UserProfile[];
  memberBalances: Record<string, number>;
}

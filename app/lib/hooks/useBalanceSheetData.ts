import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import { message } from "antd";
import type { Expense as ExpenseType, Deposit as DepositType } from "../types";

// --- Data Interfaces ---
export interface Member {
  uid: string;
  displayName: string;
  role: "manager" | "member";
}

export interface MemberDetailedData {
  member: Member;
  totalMeals: number; // Total count of meals consumed
  totalPaidAmount: number; // Total of Deposits made by this member ONLY
  deposits: DepositType[]; // List of Deposit records
  expensesPaid: ExpenseType[]; // All Expenses paid by this member (Kept for overall view)
  groceryExpensesPaid: ExpenseType[]; // Grocery Expenses paid by this member (for table)
  utilityExpensesPaid: ExpenseType[]; // Utility Expenses paid by this member (for manager table)
  totalMealCost: number; // Total Meals * Current Meal Rate (Replaces Net Balance box)
  mealRate: number;
}

export interface OverviewStats {
  currentMonth: string;
  allMembersData: MemberDetailedData[];
  globalMealRate: number;
}

// --- Date Helpers ---

const getCurrentMonthTimestamps = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  return {
    startTimestamp: Timestamp.fromDate(startOfMonth),
    endTimestamp: Timestamp.fromDate(endOfMonth),
  };
};

const getCurrentMonthDateStrings = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDateString: startOfMonth.toISOString().split("T")[0],
    endDateString: endOfMonth.toISOString().split("T")[0],
  };
};

// --- Hook Definition ---
export const useBalanceSheetData = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  useEffect(() => {
    if (authLoading || !messId) {
      setLoading(false);
      return;
    }

    const calculateOverview = async () => {
      setLoading(true);

      try {
        const { startTimestamp, endTimestamp } = getCurrentMonthTimestamps();
        const { startDateString, endDateString } = getCurrentMonthDateStrings();

        const currentMonthString = new Date().toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });

        // --- 1. Fetch Member List ---
        const membersQuery = query(
          collection(db, "users"),
          where("messId", "==", messId)
        );
        const membersSnapshot = await getDocs(membersQuery);
        const members: Member[] = membersSnapshot.docs.map((doc) => ({
          uid: doc.id,
          displayName: doc.data().displayName || "Unknown Member",
          role: doc.data().role || "member",
        }));

        // --- 2. Fetch ALL Monthly Data (Expenses, Meals, Deposits) ---

        // Function to fetch data using Timestamp (Crucial for correct date range)
        const fetchTimestampData = async (
          collectionName: string
        ): Promise<DocumentData[]> => {
          // Note: Firestore recommends using the date field for querying
          const q = query(
            collection(db, collectionName),
            where("messId", "==", messId),
            where("date", ">=", startTimestamp),
            where("date", "<=", endTimestamp)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        };

        // Function to fetch data using Date String (for Meals)
        const fetchStringDateData = async (
          collectionName: string
        ): Promise<DocumentData[]> => {
          const q = query(
            collection(db, collectionName),
            where("messId", "==", messId),
            where("date", ">=", startDateString),
            where("date", "<=", endDateString)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        };

        const [expensesData, mealsData, depositsData] = await Promise.all([
          fetchTimestampData("expenses"),
          fetchStringDateData("meals"),
          fetchTimestampData("deposits"),
        ]);

        const allExpenses: ExpenseType[] = expensesData as ExpenseType[];
        const allMeals = mealsData as DocumentData[];
        const allDeposits: DepositType[] = depositsData as DepositType[];

        // --- 3. Global Meal Rate Calculation ---

        // 🔥 FIX: Filter expenses to include ONLY 'grocery' or 'meal' costs
        // This ensures the rate is calculated using only food-related expenses.
        const mealExpensesForRate = allExpenses.filter(
          (exp) => exp.category === "grocery" || exp.category === "meal"
        );

        const totalMealCostForRate = mealExpensesForRate.reduce(
          (sum, exp) => sum + exp.amount,
          0
        );

        const totalMealsCount = allMeals.reduce(
          (sum, meal) =>
            sum +
            (meal.breakfast ? 1 : 0) +
            (meal.lunch ? 1 : 0) +
            (meal.dinner ? 1 : 0),
          0
        );

        const globalMealRate =
          totalMealsCount > 0 ? totalMealCostForRate / totalMealsCount : 0;

        // --- 4. Aggregate Data by Member ---
        const allMembersData: MemberDetailedData[] = members.map((member) => {
          const memberMeals = allMeals.filter((m) => m.userId === member.uid);
          const memberTotalMeals = memberMeals.reduce(
            (sum, meal) =>
              sum +
              (meal.breakfast ? 1 : 0) +
              (meal.lunch ? 1 : 0) +
              (meal.dinner ? 1 : 0),
            0
          );

          // All expenses paid by the member
          const expensesPaid = allExpenses.filter(
            (exp) => exp.paidBy === member.uid
          );

          // Separate expenses by category for tables
          const groceryExpensesPaid = expensesPaid.filter(
            (exp) => exp.category === "grocery" || exp.category === "meal"
          );
          const utilityExpensesPaid = expensesPaid.filter(
            (exp) => exp.category === "utility"
          );

          // Deposits made FOR this member (where userId is the beneficiary)
          const deposits = allDeposits.filter(
            (dep) => dep.userId === member.uid
          );

          // 🔥 FIX: totalPaidAmount is NOW ONLY the total deposits for this member
          const totalPaidAmount = deposits.reduce(
            (sum, dep) => sum + dep.amount,
            0
          );

          const totalMealCost = memberTotalMeals * globalMealRate;

          return {
            member,
            totalMeals: memberTotalMeals,
            totalPaidAmount,
            deposits: deposits as DepositType[],
            expensesPaid: expensesPaid as ExpenseType[],
            groceryExpensesPaid: groceryExpensesPaid as ExpenseType[],
            utilityExpensesPaid: utilityExpensesPaid as ExpenseType[],
            totalMealCost,
            mealRate: globalMealRate,
          };
        });

        // --- 5. Set Final Stats ---
        setStats({
          currentMonth: currentMonthString,
          allMembersData,
          globalMealRate,
        });
      } catch (error) {
        console.error(
          "FATAL ERROR: Detailed data calculation failed. Check if Firestore indexes are needed.",
          error
        );
        message.error(
          "Failed to load all monthly data. Check console for database or index issues."
        );
      } finally {
        setLoading(false);
      }
    };

    // Note: For debugging real-time issues, ensure the component that saves the expense
    // triggers a state change in a parent component, forcing this hook to run again,
    // OR implement a real-time listener (onSnapshot), which is more complex.
    calculateOverview();
  }, [messId, authLoading]); // Dependencies

  return { stats, loading };
};

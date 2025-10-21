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

export interface Member {
  uid: string;
  displayName: string;
  role: "manager" | "member";
}

export interface MemberDetailedData {
  member: Member;
  totalMeals: number;
  totalPaidAmount: number;
  deposits: DepositType[];
  expensesPaid: ExpenseType[];
  groceryExpensesPaid: ExpenseType[];
  utilityExpensesPaid: ExpenseType[];
  totalMealCost: number;
  mealRate: number;
}

export interface OverviewStats {
  currentMonth: string;
  allMembersData: MemberDetailedData[];
  globalMealRate: number;
}

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

        const fetchTimestampData = async (
          collectionName: string
        ): Promise<DocumentData[]> => {
          const q = query(
            collection(db, collectionName),
            where("messId", "==", messId),
            where("date", ">=", startTimestamp),
            where("date", "<=", endTimestamp)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        };

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

          const expensesPaid = allExpenses.filter(
            (exp) => exp.paidBy === member.uid
          );

          const groceryExpensesPaid = expensesPaid.filter(
            (exp) => exp.category === "grocery" || exp.category === "meal"
          );
          const utilityExpensesPaid = expensesPaid.filter(
            (exp) => exp.category === "utility"
          );

          const deposits = allDeposits.filter(
            (dep) => dep.userId === member.uid
          );

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

    calculateOverview();
  }, [messId, authLoading]);

  return { stats, loading };
};

import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import { UserProfile } from "../types";

// --- Interface Definitions (Unchanged) ---

interface Expense {
  id: string;
  amount: number;
  paidBy: string;
  date: Timestamp;
  category: string;
}

interface Deposit {
  id: string;
  userId: string;
  amount: number;
  date: Timestamp;
}

interface Meal {
  id: string;
  userId: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  date: string;
}

export interface OverviewStats {
  totalMeals: number;
  totalExpenses: number;
  totalMealCostForRate: number;
  totalDeposits: number;
  mealRate: number;
  currentMonth: string;
  members: UserProfile[];
  memberBalances: Record<string, number>;
}

// --- Date Range Helper (Unchanged) ---

const getCurrentMonthRange = () => {
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

  const startOfMonthString = startOfMonth.toISOString().split("T")[0];
  const endOfMonthString = endOfMonth.toISOString().split("T")[0];

  return {
    start: Timestamp.fromDate(startOfMonth),
    end: Timestamp.fromDate(endOfMonth),
    startString: startOfMonthString,
    endString: endOfMonthString,
    monthStr: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
  };
};

// --- Main Hook ---

export const useOverviewData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);

  const { start, end, startString, endString, monthStr } = useMemo(
    getCurrentMonthRange,
    []
  );

  const messId = user?.messId;
  const currentUserId = user?.uid;

  useEffect(() => {
    // ... (Firebase listener logic remains the same)
    if (!messId) {
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    setLoading(true);

    const setupMonthlyListener = (
      colName: string,
      setData: (data: any[]) => void
    ) => {
      const q = query(
        collection(db, colName),
        where("messId", "==", messId),
        where("date", ">=", start),
        where("date", "<=", end)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as any)
          );
          setData(data);
        },
        (error) => console.error(`Error fetching ${colName}:`, error)
      );
    };

    unsubscribes.push(setupMonthlyListener("expenses", setExpenses));
    unsubscribes.push(setupMonthlyListener("deposits", setDeposits));

    const mealQ = query(
      collection(db, "meals"),
      where("messId", "==", messId),
      where("date", ">=", startString),
      where("date", "<=", endString)
    );
    unsubscribes.push(
      onSnapshot(
        mealQ,
        (snapshot) => {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Meal)
          );
          setMeals(data);
        },
        (error) => console.error("Error fetching meals:", error)
      )
    );

    const membersQ = query(
      collection(db, "users"),
      where("messId", "==", messId)
    );
    unsubscribes.push(
      onSnapshot(
        membersQ,
        (snapshot) => {
          const data = snapshot.docs.map(
            (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
          );
          setMembers(data);
          setLoading(false);
        },
        (error) => console.error("Error fetching members:", error)
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId, start, end, startString, endString]); // --- Calculation Logic (Memoized) ---

  const stats = useMemo<OverviewStats | null>(() => {
    if (loading || !messId || members.length === 0) return null; // 1. Calculate Total Meals

    const totalMeals = meals.reduce(
      (sum, meal) =>
        sum +
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0),
      0
    ); // 2. Calculate Total Expenses (All) & Deposits

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalDeposits = deposits.reduce((sum, dep) => sum + dep.amount, 0); // Meal Rate Calculation: Filter expenses for meal cost only (Grocery/Meal)

    const mealExpensesForRate = expenses.filter(
      (exp) => exp.category === "grocery" || exp.category === "meal"
    );
    const totalMealCostForRate = mealExpensesForRate.reduce(
      (sum, exp) => sum + exp.amount,
      0
    ); // Meal Rate calculation

    const mealRate = totalMeals > 0 ? totalMealCostForRate / totalMeals : 50; // 3. Calculate Individual Balance

    const memberMealCounts = meals.reduce((map, meal) => {
      const count =
        (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0);
      map.set(meal.userId, (map.get(meal.userId) || 0) + count);
      return map;
    }, new Map<string, number>()); // Individual Contributions: Deposit + Grocery Expense Paid (As Credit)

    const memberCredit: Record<string, number> = {}; // 🟢 3a. Deposit is Credit

    deposits.forEach((dep) => {
      memberCredit[dep.userId] = (memberCredit[dep.userId] || 0) + dep.amount;
    }); // 🟢 3b. ONLY Grocery Expense Paid is Credit (New Logic)

    expenses.forEach((exp) => {
      if (exp.category === "grocery") {
        memberCredit[exp.paidBy] = (memberCredit[exp.paidBy] || 0) + exp.amount;
      }
    }); // 4. Final Balance calculation
    // Note: Other expenses (utility, etc.) paid by members are NOT added as credit.

    const memberBalances: Record<string, number> = {};

    members.forEach((member) => {
      const mealsTaken = memberMealCounts.get(member.uid) || 0; // Credit is Deposit + Grocery Paid
      const credit = memberCredit[member.uid] || 0;

      const cost = mealsTaken * mealRate; // Balance = Contribution (Deposit + Grocery Paid) - Cost (Meal Cost)
      const balance = credit - cost;

      memberBalances[member.uid] = parseFloat(balance.toFixed(2));
    });

    return {
      totalMeals: totalMeals,
      totalExpenses: totalExpenses,
      totalMealCostForRate: parseFloat(totalMealCostForRate.toFixed(2)),
      totalDeposits: totalDeposits,
      mealRate: parseFloat(mealRate.toFixed(2)),
      currentMonth: monthStr,
      members: members,
      memberBalances: memberBalances,
    };
  }, [meals, expenses, deposits, members, loading, messId, monthStr]);

  return { stats, loading, messId, currentUserId };
};

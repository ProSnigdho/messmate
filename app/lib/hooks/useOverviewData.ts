"use client";

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
import Dayjs from "dayjs";

interface Expense {
  id: string;
  amount: number;
  paidBy: string;
  date: Timestamp;
  category: string;
  title?: string;
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

interface GroceryPurchase {
  id: string;
  totalCost: number;
  date: Timestamp;
  boughtById: string;
}

export interface OverviewStats {
  totalMeals: number;
  totalGroceryCost: number;
  mealRate: number;
  totalDeposits: number;
  totalUtilityCost: number;
  utilityCostPerMember: number;
  currentMonth: string;
  members: UserProfile[];
  memberFinalBalances: Record<string, number>;
  memberMealCounts: Record<string, number>;
  memberGroceryPaid: Record<string, number>;
}

const getMonthStartString = (): string =>
  Dayjs().startOf("month").format("YYYY-MM-DD");
const getMonthEndString = (): string =>
  Dayjs().endOf("month").format("YYYY-MM-DD");
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

  return {
    start: Timestamp.fromDate(startOfMonth),
    end: Timestamp.fromDate(endOfMonth),
    startString: getMonthStartString(),
    endString: getMonthEndString(),
    monthStr: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
  };
};

const DIVIDED_EXPENSE_CATEGORIES = [
  "gas",
  "internet",
  "electricity",
  "water",
  "cleaner",
  "other_bills",
  "utility",
];

export const useOverviewData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [groceryPurchases, setGroceryPurchases] = useState<GroceryPurchase[]>(
    []
  );
  const [members, setMembers] = useState<UserProfile[]>([]);

  const { start, end, startString, endString, monthStr } = useMemo(
    getCurrentMonthRange,
    []
  );

  const messId = user?.messId;
  const currentUserId = user?.uid;

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    setLoading(true);

    const setupMonthlyListener = (
      colName: string,
      setData: (data: any[]) => void,
      dateField: string = "date"
    ) => {
      const q = query(
        collection(db, colName),
        where("messId", "==", messId),
        where(dateField, ">=", start),
        where(dateField, "<=", end)
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

    const groceryQ = query(
      collection(db, "grocery"),
      where("messId", "==", messId)
    );
    unsubscribes.push(
      onSnapshot(
        groceryQ,
        (snapshot) => {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as GroceryPurchase)
          );

          const startOfMonth = Dayjs(startString);
          const endOfMonth = Dayjs(endString);

          const monthlyGrocery = data.filter((purchase) => {
            if (!purchase.date || typeof purchase.date.toDate !== "function") {
              return false;
            }
            const purchaseDate = Dayjs(purchase.date.toDate());
            return (
              purchaseDate.isAfter(startOfMonth.subtract(1, "day")) &&
              purchaseDate.isBefore(endOfMonth.add(1, "day"))
            );
          });

          setGroceryPurchases(monthlyGrocery);
        },
        (error) => console.error("Error fetching grocery data:", error)
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
  }, [messId, start, end, startString, endString]);

  const stats = useMemo<OverviewStats | null>(() => {
    if (loading || !messId || members.length === 0) return null;

    const memberMealCounts: Record<string, number> = {};
    let totalMeals = 0;

    meals.forEach((meal) => {
      const mealCount =
        (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0);
      totalMeals += mealCount;
      memberMealCounts[meal.userId] =
        (memberMealCounts[meal.userId] || 0) + mealCount;
    });

    const totalGroceryCost = groceryPurchases.reduce(
      (sum, grocery) => sum + grocery.totalCost,
      0
    );

    const mealRate = totalMeals > 0 ? totalGroceryCost / totalMeals : 0;

    const utilityExpenses = expenses.filter((exp) =>
      DIVIDED_EXPENSE_CATEGORIES.includes(exp.category)
    );
    const totalUtilityCost = utilityExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const activeMembers = members.filter((m) => m.role !== "pending");
    const utilityCostPerMember =
      activeMembers.length > 0 ? totalUtilityCost / activeMembers.length : 0;

    const totalDeposits = deposits.reduce((sum, dep) => sum + dep.amount, 0);

    const memberGroceryPaid: Record<string, number> = {};
    groceryPurchases.forEach((grocery) => {
      memberGroceryPaid[grocery.boughtById] =
        (memberGroceryPaid[grocery.boughtById] || 0) + grocery.totalCost;
    });

    const memberFinalBalances: Record<string, number> = {};

    members.forEach((member) => {
      const mealsTaken = memberMealCounts[member.uid] || 0;
      const mealCost = mealsTaken * mealRate;
      const groceryPaid = memberGroceryPaid[member.uid] || 0;

      const finalBalance = groceryPaid - mealCost;

      memberFinalBalances[member.uid] = parseFloat(finalBalance.toFixed(2));
    });

    return {
      totalMeals,
      totalGroceryCost: parseFloat(totalGroceryCost.toFixed(2)),
      mealRate: parseFloat(mealRate.toFixed(2)),
      totalDeposits: parseFloat(totalDeposits.toFixed(2)),
      totalUtilityCost: parseFloat(totalUtilityCost.toFixed(2)),
      utilityCostPerMember: parseFloat(utilityCostPerMember.toFixed(2)),
      currentMonth: monthStr,
      members,
      memberFinalBalances,
      memberMealCounts,
      memberGroceryPaid,
    };
  }, [
    meals,
    groceryPurchases,
    expenses,
    deposits,
    members,
    loading,
    messId,
    monthStr,
  ]);

  return { stats, loading, messId, currentUserId };
};

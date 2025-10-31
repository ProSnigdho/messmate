"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import type {
  Meal,
  UserProfile,
  Expense,
  Deposit,
  ExpenseCategory,
} from "../types";
import Dayjs from "dayjs";

interface MealData extends Meal {
  id: string;
}

interface GroceryPurchaseData {
  id: string;
  totalCost: number;
  date: any;
  boughtById: string;
}

interface ExpenseData extends Expense {
  id: string;
}

interface DepositData extends Deposit {
  id: string;
}

export interface Member {
  uid: string;
  displayName: string;
  role: "manager" | "member" | "pending";
}

export interface MemberDetailedData {
  member: Member;
  totalMeals: number;
  totalPaidAmount: number;
  monthlyTotalPaid: number;
  deposits: DepositData[];
  groceryExpensesPaid: ExpenseData[];
  utilityExpensesPaid: ExpenseData[];
  totalMealCost: number;
  mealRate: number;
  utilityShare: number;
  finalBalance: number;
}

export interface BalanceSheetStats {
  currentMonth: string;
  allMembersData: MemberDetailedData[];
  globalMealRate: number;
  totalUtilityCost: number;
  utilityCostPerMember: number;
  totalGroceryCost: number;
  totalMeals: number;
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
    start: startOfMonth,
    end: endOfMonth,
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

export const useBalanceSheetData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [monthlyMeals, setMonthlyMeals] = useState<MealData[]>([]);
  const [monthlyGroceryPurchases, setMonthlyGroceryPurchases] = useState<
    GroceryPurchaseData[]
  >([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<ExpenseData[]>([]);
  const [monthlyDeposits, setMonthlyDeposits] = useState<DepositData[]>([]);

  const { start, end, startString, endString, monthStr } = useMemo(
    getCurrentMonthRange,
    []
  );

  const messId = user?.messId;

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    const membersQuery = query(
      collection(db, "users"),
      where("messId", "==", messId)
    );
    unsubscribes.push(
      onSnapshot(membersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedMembers = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              uid: doc.id,
              ...doc.data(),
            } as UserProfile)
        );
        setMembers(fetchedMembers);
      })
    );

    const monthlyMealQuery = query(
      collection(db, "meals"),
      where("messId", "==", messId),
      where("date", ">=", startString),
      where("date", "<=", endString)
    );
    unsubscribes.push(
      onSnapshot(
        monthlyMealQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedMeals = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as MealData)
          );
          setMonthlyMeals(fetchedMeals);
        },
        (error) => {
          console.error("Error fetching monthly meal data:", error);
        }
      )
    );

    const groceryQuery = query(
      collection(db, "grocery"),
      where("messId", "==", messId)
    );
    unsubscribes.push(
      onSnapshot(
        groceryQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const startOfMonth = Dayjs(startString);
          const endOfMonth = Dayjs(endString);

          const monthlyGrocery = snapshot.docs
            .map(
              (doc) => ({ id: doc.id, ...doc.data() } as GroceryPurchaseData)
            )
            .filter((purchase) => {
              if (
                !purchase.date ||
                typeof purchase.date.toDate !== "function"
              ) {
                return false;
              }
              const purchaseDate = Dayjs(purchase.date.toDate());
              return (
                purchaseDate.isAfter(startOfMonth.subtract(1, "day")) &&
                purchaseDate.isBefore(endOfMonth.add(1, "day"))
              );
            });
          setMonthlyGroceryPurchases(monthlyGrocery);
        },
        (error) => {
          console.error("Error fetching monthly grocery data:", error);
        }
      )
    );

    const expensesQuery = query(
      collection(db, "expenses"),
      where("messId", "==", messId),
      where("date", ">=", start),
      where("date", "<=", end)
    );
    unsubscribes.push(
      onSnapshot(
        expensesQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedExpenses = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as ExpenseData)
          );
          setMonthlyExpenses(fetchedExpenses);
        },
        (error) => {
          console.error("Error fetching expenses data:", error);
        }
      )
    );

    const depositsQuery = query(
      collection(db, "deposits"),
      where("messId", "==", messId),
      where("date", ">=", start),
      where("date", "<=", end)
    );
    unsubscribes.push(
      onSnapshot(
        depositsQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedDeposits = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as DepositData)
          );
          setMonthlyDeposits(fetchedDeposits);
        },
        (error) => {
          console.error("Error fetching deposits data:", error);
        }
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId, start, end, startString, endString]);

  const stats = useMemo<BalanceSheetStats | null>(() => {
    if (loading || !messId || members.length === 0) return null;

    const memberMealCounts: Record<string, number> = {};
    let totalMeals = 0;

    monthlyMeals.forEach((meal) => {
      const mealCount =
        (meal.breakfast ? 1 : 0) +
        (meal.lunch ? 1 : 0) +
        (meal.dinner ? 1 : 0) +
        (meal.guestMeals || 0);
      totalMeals += mealCount;
      memberMealCounts[meal.userId] =
        (memberMealCounts[meal.userId] || 0) + mealCount;
    });

    const totalGroceryCost = monthlyGroceryPurchases.reduce(
      (sum, grocery) => sum + grocery.totalCost,
      0
    );

    const globalMealRate = totalMeals > 0 ? totalGroceryCost / totalMeals : 0;

    const utilityExpenses = monthlyExpenses.filter((exp) =>
      DIVIDED_EXPENSE_CATEGORIES.includes(exp.category)
    );

    const totalUtilityCost = utilityExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    const activeMembers = members.filter((m) => m.role !== "pending");
    const utilityCostPerMember =
      activeMembers.length > 0 ? totalUtilityCost / activeMembers.length : 0;

    const memberGroceryPaid: Record<string, number> = {};
    monthlyGroceryPurchases.forEach((grocery) => {
      memberGroceryPaid[grocery.boughtById] =
        (memberGroceryPaid[grocery.boughtById] || 0) + grocery.totalCost;
    });

    const allMembersData: MemberDetailedData[] = members.map((member) => {
      const memberTotalMeals = memberMealCounts[member.uid] || 0;

      const memberDeposits = monthlyDeposits.filter(
        (dep) => dep.userId === member.uid
      );

      const expensesPaid = monthlyExpenses.filter(
        (exp) => exp.paidBy === member.uid
      );

      const groceryExpensesPaid = expensesPaid.filter(
        (exp) => exp.category === "grocery" || exp.category === "meal"
      );

      const utilityExpensesPaid = expensesPaid.filter(
        (exp) => exp.category === "utility"
      );

      const totalPaidAmount = memberDeposits.reduce(
        (sum, dep) => sum + dep.amount,
        0
      );

      const monthlyTotalPaid = memberGroceryPaid[member.uid] || 0;

      const totalMealCost = memberTotalMeals * globalMealRate;

      const utilityShare = member.role !== "pending" ? utilityCostPerMember : 0;

      const finalBalance = monthlyTotalPaid - totalMealCost;

      return {
        member: {
          uid: member.uid,
          displayName: member.displayName,
          role: member.role,
        },
        totalMeals: memberTotalMeals,
        totalPaidAmount,
        monthlyTotalPaid,
        deposits: memberDeposits,
        groceryExpensesPaid,
        utilityExpensesPaid,
        totalMealCost: parseFloat(totalMealCost.toFixed(2)),
        mealRate: parseFloat(globalMealRate.toFixed(2)),
        utilityShare: parseFloat(utilityShare.toFixed(2)),
        finalBalance: parseFloat(finalBalance.toFixed(2)),
      };
    });

    return {
      currentMonth: monthStr,
      allMembersData,
      globalMealRate: parseFloat(globalMealRate.toFixed(2)),
      totalUtilityCost: parseFloat(totalUtilityCost.toFixed(2)),
      utilityCostPerMember: parseFloat(utilityCostPerMember.toFixed(2)),
      totalGroceryCost: parseFloat(totalGroceryCost.toFixed(2)),
      totalMeals,
    };
  }, [
    monthlyMeals,
    monthlyGroceryPurchases,
    monthlyExpenses,
    monthlyDeposits,
    members,
    loading,
    messId,
    monthStr,
  ]);

  useEffect(() => {
    if (members.length > 0) {
      setLoading(false);
    }
  }, [members.length]);

  return { stats, loading };
};

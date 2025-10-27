"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  orderBy,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import type { Expense, WithoutId, ExpenseCategory } from "../types";
import { message } from "antd";

interface ExpenseData extends Expense {
  id: string;
}
type ExpensePayload = WithoutId<Expense>;

export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalContribution, setTotalContribution] = useState<number>(0);
  const [depositsLoading, setDepositsLoading] = useState(true);

  const messId = user?.messId;

  const OVERHEAD_EXPENSE_CATEGORIES: ExpenseCategory[] = [
    "gas",
    "internet",
    "electricity",
    "water",
    "cleaner",
    "other_bills",
    "utility",
  ];

  const DIVIDED_EXPENSE_CATEGORIES: ExpenseCategory[] =
    OVERHEAD_EXPENSE_CATEGORIES;

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setDepositsLoading(false);
      return;
    }

    setLoading(true);
    setDepositsLoading(true);

    const unsubscribes: (() => void)[] = [];

    const expensesQuery = query(
      collection(db, "expenses"),
      where("messId", "==", messId),
      orderBy("date", "desc")
    );

    unsubscribes.push(
      onSnapshot(
        expensesQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          let fetchedExpenses: ExpenseData[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Expense;
            return { ...data, id: doc.id };
          });

          fetchedExpenses = fetchedExpenses.filter((expense) =>
            OVERHEAD_EXPENSE_CATEGORIES.includes(expense.category)
          );

          setExpenses(fetchedExpenses);
        },
        (error) => {
          console.error("Error fetching expenses: ", error);
          message.error("Failed to load expenses.");
        }
      )
    );

    const membersQuery = query(
      collection(db, "users"),
      where("messId", "==", messId)
    );

    unsubscribes.push(
      onSnapshot(
        membersQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedMembers = snapshot.docs.map((doc) => ({
            id: doc.id,
            uid: doc.id,
            ...doc.data(),
          }));
          setMembers(fetchedMembers);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching members: ", error);
          setLoading(false);
        }
      )
    );

    const depositsQuery = query(
      collection(db, "deposits"),
      where("messId", "==", messId)
    );

    unsubscribes.push(
      onSnapshot(
        depositsQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const sum = snapshot.docs.reduce(
            (acc, doc) => acc + (doc.data().amount || 0),
            0
          );
          setTotalContribution(sum);
          setDepositsLoading(false);
        },
        (error) => {
          console.error("Error fetching total deposits: ", error);
          setDepositsLoading(false);
        }
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId]);

  const calculateDividedAmount = (
    amount: number,
    category: ExpenseCategory
  ): number => {
    if (!DIVIDED_EXPENSE_CATEGORIES.includes(category)) {
      return amount;
    }

    const activeMembers = members.filter((m) => m.role !== "pending");
    return activeMembers.length > 0 ? amount / activeMembers.length : amount;
  };

  const addExpense = async (
    title: string,
    amount: number,
    category: ExpenseCategory = "utility",
    description: string = ""
  ) => {
    if (!messId || !user) {
      message.error("User not logged in or Mess ID missing.");
      return false;
    }
    if (amount <= 0 || !title) {
      message.error("Amount must be positive and title is required.");
      return false;
    }

    try {
      const activeMembers = members.filter((m) => m.role !== "pending");
      const dividedAmount = DIVIDED_EXPENSE_CATEGORIES.includes(category)
        ? amount / activeMembers.length
        : amount;

      const newExpense: ExpensePayload = {
        messId: messId,
        title: title,
        amount: amount,
        paidBy: "mess_fund",
        paidByName: "Mess Fund",
        category: category,
        date: Timestamp.fromDate(new Date()),
        description: description,
        dividedAmount: parseFloat(dividedAmount.toFixed(2)),
        totalMembers: activeMembers.length,
      };

      await addDoc(collection(db, "expenses"), newExpense);

      if (DIVIDED_EXPENSE_CATEGORIES.includes(category)) {
        message.success(
          `Expense added! Each member needs to pay ৳${dividedAmount.toFixed(
            2
          )} for ${category}.`
        );
      } else {
        message.success("Expense added successfully!");
      }

      return true;
    } catch (error) {
      console.error("Error adding expense:", error);
      message.error("Failed to record expense. Please check your network.");
      return false;
    }
  };

  const getMemberDueAmount = (category: ExpenseCategory): number => {
    const categoryExpenses = expenses.filter(
      (exp) => exp.category === category
    );
    const totalAmount = categoryExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const activeMembers = members.filter((m) => m.role !== "pending");

    return activeMembers.length > 0 ? totalAmount / activeMembers.length : 0;
  };

  const getDividedExpensesSummary = () => {
    const summary: Record<string, { total: number; perMember: number }> = {};

    DIVIDED_EXPENSE_CATEGORIES.forEach((category) => {
      const categoryExpenses = expenses.filter(
        (exp) => exp.category === category
      );
      const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const activeMembers = members.filter((m) => m.role !== "pending");
      const perMember =
        activeMembers.length > 0 ? total / activeMembers.length : 0;

      summary[category] = {
        total: parseFloat(total.toFixed(2)),
        perMember: parseFloat(perMember.toFixed(2)),
      };
    });

    return summary;
  };

  return {
    expenses,
    members,
    loading: loading || depositsLoading,
    addExpense,
    totalContribution,
    getMemberDueAmount,
    getDividedExpensesSummary,
    DIVIDED_EXPENSE_CATEGORIES,
  };
};

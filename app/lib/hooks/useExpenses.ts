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
import type { Expense, WithoutId } from "../types";
import { message } from "antd";

interface ExpenseData extends Expense {
  id: string;
}
type ExpensePayload = WithoutId<Expense>;

export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true); // Total Contribution (calculated from 'deposits' collection)
  const [totalContribution, setTotalContribution] = useState<number>(0);
  const [depositsLoading, setDepositsLoading] = useState(true);

  const messId = user?.messId;
  const EXPENSE_CATEGORY_TO_MANAGE = "utility";

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setDepositsLoading(false);
      return;
    }

    setLoading(true);
    setDepositsLoading(true);

    const unsubscribes: (() => void)[] = []; // 1. Fetching Overhead Expenses

    const expensesQuery = query(
      collection(db, "expenses"),
      where("messId", "==", messId),
      where("category", "==", EXPENSE_CATEGORY_TO_MANAGE),
      orderBy("date", "desc")
    );

    unsubscribes.push(
      onSnapshot(
        expensesQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedExpenses: ExpenseData[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Expense;
            return { ...data, id: doc.id };
          });

          setExpenses(fetchedExpenses);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching expenses: ", error);
          message.error(
            "Failed to load expenses. Check console for index requirements."
          );
          setLoading(false);
        }
      )
    );

    // 2. Fetching and summing Total Contribution from 'deposits' collection
    const depositsQuery = query(
      collection(db, "deposits"),
      where("messId", "==", messId)
    );

    unsubscribes.push(
      onSnapshot(
        depositsQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          // ✅ Fix: Accurately sum all deposits for Total Contribution
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

  const addExpense = async (
    title: string,
    amount: number,
    category: Expense["category"] = EXPENSE_CATEGORY_TO_MANAGE as any,
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
      const newExpense: ExpensePayload = {
        messId: messId,
        title: title,
        amount: amount, // ✅ Fix: Expense is paid by the Mess Fund
        paidBy: "mess_fund",
        paidByName: "Mess Fund", // Display name for the fund
        category: category,
        date: Timestamp.fromDate(new Date()),
        description: description,
      };

      await addDoc(collection(db, "expenses"), newExpense);
      return true;
    } catch (error) {
      console.error("Error adding expense:", error);
      message.error("Failed to record expense. Please check your network.");
      return false;
    }
  };

  return {
    expenses,
    loading: loading || depositsLoading,
    addExpense,
    totalContribution,
  };
};

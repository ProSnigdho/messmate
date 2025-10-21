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

// --- Data Structures ---
interface ExpenseData extends Expense {
  id: string;
}
type ExpensePayload = WithoutId<Expense>;

// --- Hook ---
export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;
  const paidByName = user?.displayName || user?.email || "Unknown User";

  // ✅ FIX: Define the category we want to fetch/save here
  const EXPENSE_CATEGORY_TO_MANAGE = "utility";

  // --- A. Data Fetching Logic (Only fetch 'utility' expenses) ---
  useEffect(() => {
    if (!messId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 🔥 FIX 1: Filter the expenses by the category
    const expensesQuery = query(
      collection(db, "expenses"),
      where("messId", "==", messId),
      where("category", "==", EXPENSE_CATEGORY_TO_MANAGE), // ✅ Only fetch utility/overhead
      orderBy("date", "desc")
    );

    // NOTE: This new query will require a composite index if you haven't created one:
    // Index: messId (asc), category (asc), date (desc)

    const unsubscribe = onSnapshot(
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
        // If you get a FirebaseError here, you need to create the new index.
        message.error(
          "Failed to load expenses. Check console for index requirements."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [messId]);

  // --- B. Add Expense Functionality (Saves with 'utility' category) ---
  const addExpense = async (
    title: string,
    amount: number,
    category: Expense["category"] = EXPENSE_CATEGORY_TO_MANAGE as any, // ✅ Use the defined category
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
        amount: amount,
        paidBy: user.uid,
        paidByName: paidByName,
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

  return { expenses, loading, addExpense };
};

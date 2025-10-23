import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import { message } from "antd";

export interface GroceryPurchase {
  id: string;
  messId: string;
  items: string;
  totalCost: number;
  date: Timestamp;
  boughtBy: string;
  boughtById: string;
}

export interface MemberSpentSummary {
  name: string;
  totalSpent: number;
}

export const useGroceryHistory = () => {
  const { user, isManager } = useAuth();
  const [history, setHistory] = useState<GroceryPurchase[]>([]);
  const [allPurchases, setAllPurchases] = useState<GroceryPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;
  const isMember = user?.role === "member";
  const currentUserId = user?.uid;

  // --- Purchase History Fetching ---
  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setAllPurchases([]);
      setHistory([]);
      return;
    }

    setLoading(true);
    const historyRef = collection(db, "grocery");

    const baseQuery = query(
      historyRef,
      where("messId", "==", messId),
      orderBy("date", "desc"),
      limit(isManager ? 100 : 30)
    );

    const unsubscribe = onSnapshot(
      baseQuery,
      (snapshot) => {
        const fetchedHistory: GroceryPurchase[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...(doc.data() as Omit<GroceryPurchase, "id">),
            } as GroceryPurchase)
        );

        setAllPurchases(fetchedHistory);

        // FIX: Member Filtering - Only show member's own purchases
        if (!isManager && currentUserId) {
          const memberHistory = fetchedHistory.filter(
            (purchase) => purchase.boughtById === currentUserId
          );
          setHistory(memberHistory);
        } else {
          setHistory(fetchedHistory);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching grocery history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [messId, isManager, currentUserId]);

  // --- Calculate Total Spent per Member ---
  const memberSpentSummary = useMemo((): MemberSpentSummary[] => {
    if (!allPurchases.length) return [];

    const memberMap = new Map<string, { name: string; totalSpent: number }>();

    allPurchases.forEach((purchase) => {
      const userId = purchase.boughtById;
      const currentData = memberMap.get(userId) || {
        name: purchase.boughtBy,
        totalSpent: 0,
      };

      currentData.totalSpent += purchase.totalCost;
      memberMap.set(userId, currentData);
    });

    return Array.from(memberMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );
  }, [allPurchases]);

  const recordNewPurchase = async (
    items: string,
    totalCost: number,
    date: Date
  ) => {
    if (!messId || !user || totalCost <= 0 || !items.trim()) {
      message.error("Invalid input or session error. Please login again.");
      return false;
    }

    try {
      const expenseData = {
        messId: messId,
        title: items.trim().substring(0, 50),
        amount: totalCost,
        description: `Grocery: ${items.trim()}`,
        paidBy: user.uid,
        paidByName: user.displayName || "Unknown User",
        date: Timestamp.fromDate(date),
        category: "grocery",
      };
      await addDoc(collection(db, "expenses"), expenseData);

      const groceryData: Omit<GroceryPurchase, "id"> = {
        messId: messId,
        items: items.trim(),
        totalCost: totalCost,
        date: Timestamp.fromDate(date),
        boughtBy: user.displayName || "Unknown User",
        boughtById: user.uid,
      };
      await addDoc(collection(db, "grocery"), groceryData);

      message.success(
        `Meal Expense of ৳${totalCost} recorded for ${new Date(
          date
        ).toLocaleDateString()}.`
      );
      return true;
    } catch (error) {
      console.error("Error recording grocery purchase:", error);
      message.error("Failed to record expense. Check console.");
      return false;
    }
  };

  return {
    history,
    loading,
    recordNewPurchase,
    isManager,
    isMember,
    memberSpentSummary,
    user, // ✅ FIX: Returning 'user' object
  };
};

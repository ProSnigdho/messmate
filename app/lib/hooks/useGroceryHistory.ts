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
  QuerySnapshot,
  DocumentData,
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

export interface MemberData {
  uid: string;
  displayName: string;
  role: string;
}

export const useGroceryHistory = () => {
  const { user, isManager } = useAuth();
  const [history, setHistory] = useState<GroceryPurchase[]>([]);
  const [allPurchases, setAllPurchases] = useState<GroceryPurchase[]>([]);

  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;
  const isMember = user?.role === "member";
  const currentUserId = user?.uid;

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setAllPurchases([]);
      setHistory([]);
      setAllMembers([]);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    const historyRef = collection(db, "grocery");

    const baseQuery = query(
      historyRef,
      where("messId", "==", messId),
      orderBy("date", "desc"),
      limit(isManager ? 100 : 30)
    );

    unsubscribes.push(
      onSnapshot(
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

          if (!isManager && currentUserId) {
            const memberHistory = fetchedHistory.filter(
              (purchase) => purchase.boughtById === currentUserId
            );
            setHistory(memberHistory);
          } else {
            setHistory(fetchedHistory);
          }
        },
        (error) => {
          console.error("Error fetching grocery history:", error);
        }
      )
    );

    const usersQuery = query(
      collection(db, "users"),
      where("messId", "==", messId)
    );

    unsubscribes.push(
      onSnapshot(
        usersQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const membersData: MemberData[] = snapshot.docs.map((doc) => ({
            uid: doc.id,
            displayName: doc.data().displayName || "Unknown Member",
            role: doc.data().role,
          }));

          setAllMembers(membersData);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching members:", error);
          setLoading(false);
        }
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId, isManager, currentUserId]);

  const activeMembers = useMemo(() => {
    return allMembers.filter((member) => member.role !== "pending");
  }, [allMembers]);

  const memberSpentSummary = useMemo((): MemberSpentSummary[] => {
    if (!allPurchases.length) return [];

    const memberMap = new Map<string, { name: string; totalSpent: number }>();

    allPurchases.forEach((purchase) => {
      const isActive = activeMembers.some((m) => m.uid === purchase.boughtById);
      if (!isActive) return;

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
  }, [allPurchases, activeMembers]);

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
    allPurchases,
    allMembers: activeMembers,
    loading,
    recordNewPurchase,
    isManager,
    isMember,
    memberSpentSummary,
    user,
  };
};

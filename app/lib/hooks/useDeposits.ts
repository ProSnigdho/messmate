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
  limit,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import type { Deposit, UserProfile, WithoutId } from "../types";
import { message } from "antd";

// Data structures and types (assuming these are defined elsewhere)
interface DepositData extends Deposit {
  id: string;
}
type DepositPayload = WithoutId<Deposit>;

export const useDeposits = () => {
  const { user, isManager } = useAuth();
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setDeposits([]);
      setMembers([]);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    // 1. Fetching Deposits (Contributions)
    const depositsRef = collection(db, "deposits");
    const depositsQuery = query(
      depositsRef,
      where("messId", "==", messId),
      orderBy("date", "desc"),
      limit(50)
    );

    unsubscribes.push(
      onSnapshot(
        depositsQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedDeposits: DepositData[] = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...(doc.data() as DepositPayload),
              } as DepositData)
          );
          setDeposits(fetchedDeposits);
        },
        (error: Error) => {
          console.error("Error fetching contributions:", error);
        }
      )
    );

    // 2. Fetching Members
    const membersQ = query(
      collection(db, "users"),
      where("messId", "==", messId)
    );

    unsubscribes.push(
      onSnapshot(
        membersQ,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedMembers: UserProfile[] = snapshot.docs.map(
            (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
          );
          setMembers(fetchedMembers);
          setLoading(false);
        },
        (error: Error) => {
          console.error("Error fetching members:", error);
          setLoading(false);
        }
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId]);

  // --- Transaction Addition Logic ---
  const addTransaction = async (
    category: string,
    amount: number,
    involvedUid: string,
    description: string = ""
  ) => {
    const involvedMember = members.find((m) => m.uid === involvedUid);

    if (!involvedMember || amount <= 0 || !category) {
      message.error(
        "Invalid input: contribution type, member, or amount missing."
      );
      return false;
    }

    try {
      // All entries are now confirmed to be Contributions
      const newTransaction: DepositPayload = {
        messId: messId as string,
        category: category,
        description: description || `${category} contribution`,
        amount: amount,
        userId: involvedUid,
        userName: involvedMember.displayName || "Unknown User",
        date: Timestamp.fromDate(new Date()),
      };

      await addDoc(
        collection(db, "deposits"),
        newTransaction as DepositPayload
      );
      message.success(`Contribution of ৳${amount} recorded for ${category}.`);
      return true;
    } catch (error) {
      console.error("Error adding contribution:", error);
      message.error("Failed to record contribution. Please try again.");
      return false;
    }
  };

  return {
    deposits,
    members,
    loading,
    addTransaction,
    isManager,
  };
};

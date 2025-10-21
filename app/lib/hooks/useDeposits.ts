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

interface DepositData extends Deposit {
  id: string;
}
type DepositPayload = WithoutId<Deposit>;

const TRANSACTION_CATEGORIES = {
  DEPOSIT: "Personal Contribution",
  RENT: "Rent",
  UTILITY: "Utility Bill (Electricity/Water)",
  GAS: "Gas Bill",
  INTERNET: "Internet/Cable",
  OTHERS: "Others (General Expense)",
};

export const useDeposits = () => {
  const { user, isManager } = useAuth();
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setDeposits([]);
      setMembers([]);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

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
          console.error("Error fetching transactions:", error);
        }
      )
    );

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

  const addTransaction = async (
    category: string,
    amount: number,
    involvedUid: string,
    description: string = ""
  ) => {
    if (!isManager) {
      message.error(
        "Permission denied. Only Mess Managers can record transactions."
      );
      return false;
    }

    const involvedMember = members.find((m) => m.uid === involvedUid);

    if (!involvedMember || amount <= 0 || !category) {
      message.error("Invalid input: category, member, or amount missing.");
      return false;
    }

    try {
      const isDeposit = category === TRANSACTION_CATEGORIES.DEPOSIT;

      const newTransaction: DepositPayload = {
        messId: messId as string,
        category: category,
        description:
          description ||
          (isDeposit ? "Contribution received" : `${category} payment`),
        amount: amount,
        userId: involvedUid,
        userName: involvedMember.displayName || "Unknown User",
        date: Timestamp.fromDate(new Date()),
      };

      await addDoc(
        collection(db, "deposits"),
        newTransaction as DepositPayload
      );
      message.success(
        `${
          isDeposit ? "Deposit" : "Expense"
        } of ৳${amount} recorded for ${category}.`
      );
      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      message.error("Failed to record transaction. Please try again.");
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

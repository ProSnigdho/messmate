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
  limit,
  QuerySnapshot,
  DocumentData,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import type {
  Deposit,
  UserProfile,
  WithoutId,
  DepositCategory,
} from "../types";
import { message } from "antd";

interface DepositData extends Deposit {
  id: string;
}
type DepositPayload = WithoutId<Deposit>;

export const useDeposits = () => {
  const { user, isManager } = useAuth();
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  const DEPOSIT_CATEGORIES = {
    rent: { label: "Home Rent", color: "volcano" },
    utility_contribution: { label: "Utility Bill Share", color: "blue" },
    gas_contribution: { label: "Gas Bill Share", color: "orange" },
    internet_contribution: { label: "Internet Bill Share", color: "purple" },
    electricity_contribution: {
      label: "Electricity Bill Share",
      color: "volcano",
    },
    water_contribution: { label: "Water Bill Share", color: "cyan" },
    cleaner_contribution: { label: "Cleaner Salary Share", color: "green" },
    other_bills_contribution: { label: "Other Bills Share", color: "gray" },
  };

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setDeposits([]);
      setMembers([]);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    const depositsQuery = query(
      collection(db, "deposits"),
      where("messId", "==", messId),
      orderBy("date", "desc"),
      limit(100)
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

    const membersQ = query(
      collection(db, "users"),
      where("messId", "==", messId)
    );

    unsubscribes.push(
      onSnapshot(
        membersQ,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedMembers: UserProfile[] = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                uid: doc.id,
                ...doc.data(),
              } as UserProfile)
          );
          setMembers(fetchedMembers);
        },
        (error: Error) => {
          console.error("Error fetching members:", error);
        }
      )
    );

    const expensesQ = query(
      collection(db, "expenses"),
      where("messId", "==", messId),
      orderBy("date", "desc")
    );

    unsubscribes.push(
      onSnapshot(
        expensesQ,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedExpenses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setExpenses(fetchedExpenses);
          setLoading(false);
        },
        (error: Error) => {
          console.error("Error fetching expenses:", error);
          setLoading(false);
        }
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId]);

  const getTotalDueAmount = (category: DepositCategory): number => {
    const activeMembers = members.filter((m) => m.role !== "pending");
    if (activeMembers.length === 0) return 0;

    const categoryMap: Record<DepositCategory, string> = {
      rent: "rent",
      utility_contribution: "utility",
      gas_contribution: "gas",
      internet_contribution: "internet",
      electricity_contribution: "electricity",
      water_contribution: "water",
      cleaner_contribution: "cleaner",
      other_bills_contribution: "other_bills",
    };

    const expenseCategory = categoryMap[category];

    if (category === "rent") {
      return members.reduce(
        (sum, member) =>
          sum + (member.monthlyRent || 0) + (member.customRent || 0),
        0
      );
    }

    const categoryExpenses = expenses.filter(
      (exp) => exp.category === expenseCategory
    );
    return categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getMemberDueAmount = (
    category: DepositCategory,
    memberId?: string
  ): number => {
    const activeMembers = members.filter((m) => m.role !== "pending");
    if (activeMembers.length === 0) return 0;

    const categoryMap: Record<DepositCategory, string> = {
      rent: "rent",
      utility_contribution: "utility",
      gas_contribution: "gas",
      internet_contribution: "internet",
      electricity_contribution: "electricity",
      water_contribution: "water",
      cleaner_contribution: "cleaner",
      other_bills_contribution: "other_bills",
    };

    const expenseCategory = categoryMap[category];

    if (category === "rent") {
      const member = members.find((m) => m.uid === (memberId || user?.uid));
      return (member?.monthlyRent || 0) + (member?.customRent || 0);
    }

    const categoryExpenses = expenses.filter(
      (exp) => exp.category === expenseCategory
    );
    const totalAmount = categoryExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    return totalAmount / activeMembers.length;
  };

  const getMemberPaidAmount = (
    memberId: string,
    category: DepositCategory
  ): number => {
    const memberDeposits = deposits.filter(
      (dep) => dep.userId === memberId && dep.category === category
    );
    return memberDeposits.reduce((sum, dep) => sum + dep.amount, 0);
  };

  const getTotalPaidAmount = (category: DepositCategory): number => {
    const categoryDeposits = deposits.filter(
      (dep) => dep.category === category
    );
    return categoryDeposits.reduce((sum, dep) => sum + dep.amount, 0);
  };

  const addTransaction = async (
    category: DepositCategory,
    amount: number,
    involvedUid: string,
    description: string = "",
    rentMonth?: string
  ) => {
    const involvedMember = members.find((m) => m.uid === involvedUid);

    if (!involvedMember || amount <= 0 || !category) {
      message.error(
        "Invalid input: contribution type, member, or amount missing."
      );
      return false;
    }

    try {
      const baseTransaction: any = {
        messId: messId as string,
        category: category,
        description:
          description || `${DEPOSIT_CATEGORIES[category]?.label} payment`,
        amount: amount,
        userId: involvedUid,
        userName: involvedMember.displayName || "Unknown User",
        date: Timestamp.fromDate(new Date()),
      };

      if (category === "rent") {
        baseTransaction.isRentPaid = true;
        baseTransaction.rentMonth =
          rentMonth || new Date().toISOString().slice(0, 7);
        baseTransaction.month =
          rentMonth || new Date().toISOString().slice(0, 7);
      }

      await addDoc(collection(db, "deposits"), baseTransaction);

      message.success(
        `Payment of ৳${amount} recorded for ${DEPOSIT_CATEGORIES[category]?.label}.`
      );
      return true;
    } catch (error) {
      console.error("Error adding contribution:", error);
      message.error("Failed to record payment. Please try again.");
      return false;
    }
  };

  const getMemberRentStatus = (member: UserProfile) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const memberRent = (member.monthlyRent || 0) + (member.customRent || 0);

    const rentPayments = deposits.filter(
      (dep) =>
        dep.userId === member.uid &&
        dep.category === "rent" &&
        dep.rentMonth === currentMonth
    );

    const totalRentPaid = rentPayments.reduce(
      (sum, dep) => sum + dep.amount,
      0
    );
    const isFullyPaid = totalRentPaid >= memberRent;
    const remaining = memberRent - totalRentPaid;

    return {
      totalRent: memberRent,
      paid: totalRentPaid,
      remaining: remaining > 0 ? remaining : 0,
      isFullyPaid,
      payments: rentPayments,
    };
  };

  const getRentSummary = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let totalRent = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    members.forEach((member) => {
      const rentStatus = getMemberRentStatus(member);
      totalRent += rentStatus.totalRent;
      totalPaid += rentStatus.paid;
      totalRemaining += rentStatus.remaining;
    });

    return {
      currentMonth,
      totalRent,
      totalPaid,
      totalRemaining,
      collectionRate: totalRent > 0 ? (totalPaid / totalRent) * 100 : 0,
    };
  };

  return {
    deposits,
    members,
    expenses,
    loading,
    addTransaction,
    isManager,
    getTotalDueAmount,
    getMemberDueAmount,
    getMemberPaidAmount,
    getTotalPaidAmount,
    getMemberRentStatus,
    getRentSummary,
    DEPOSIT_CATEGORIES,
  };
};

// app/lib/hooks/useNotices.ts

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
} from "firebase/firestore";
import { useAuth } from "../auth-context";

// ডেটা টাইপ ডিফাইন করা হলো
export interface Notice {
  id: string;
  messId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  date: Timestamp;
}

export const useNotices = () => {
  const { user, isManager } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setNotices([]);
      return;
    }

    setLoading(true);
    const noticesRef = collection(db, "notices");
    const noticesQuery = query(
      noticesRef,
      where("messId", "==", messId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      noticesQuery,
      (snapshot) => {
        const fetchedNotices: Notice[] = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...(doc.data() as Omit<Notice, "id">),
            } as Notice)
        );
        setNotices(fetchedNotices);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notices:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [messId]);

  // নতুন নোটিশ পোস্ট করার ফাংশন
  const addNotice = async (title: string, content: string) => {
    if (!messId || !user || !isManager) {
      console.error("Access denied or Mess ID missing.");
      return false;
    }

    try {
      const newNotice = {
        messId: messId,
        authorId: user.uid,
        authorName: user.displayName || "Manager",
        title: title,
        content: content,
        date: Timestamp.fromDate(new Date()),
      };

      await addDoc(collection(db, "notices"), newNotice);
      return true;
    } catch (error) {
      console.error("Error adding notice:", error);
      return false;
    }
  };

  return { notices, loading, addNotice, isManager };
};

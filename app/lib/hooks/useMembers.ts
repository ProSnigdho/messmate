// app/lib/hooks/useMembers.ts

import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import { UserProfile } from "../types"; // ধরে নিচ্ছি আপনার UserProfile টাইপটি আছে

// MemberData extends UserProfile with Firestore ID
interface MemberData extends UserProfile {
  uid: string; // Firestore document ID is the user's UID
}

export const useMembers = () => {
  const { user, isManager } = useAuth();
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  useEffect(() => {
    if (!messId) {
      setLoading(false);
      setMembers([]);
      return;
    }

    setLoading(true);

    // Query the 'users' collection where messId matches the current messId
    const usersRef = collection(db, "users");
    const membersQuery = query(
      usersRef,
      where("messId", "==", messId),
      orderBy("displayName", "asc") // Sort by name
    );

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const fetchedMembers: MemberData[] = snapshot.docs.map(
          (doc) =>
            ({
              uid: doc.id,
              ...(doc.data() as Omit<MemberData, "uid">),
            } as MemberData)
        );
        setMembers(fetchedMembers);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching members:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [messId]);

  // --- সদস্যের রোল পরিবর্তন ---
  const updateMemberRole = async (
    memberUid: string,
    newRole: "manager" | "member"
  ) => {
    if (!messId || !isManager || memberUid === user?.uid) {
      console.error("Permission denied or cannot change own role.");
      return false;
    }

    try {
      const userRef = doc(db, "users", memberUid);
      await updateDoc(userRef, { role: newRole });
      return true;
    } catch (error) {
      console.error("Error updating member role:", error);
      return false;
    }
  };

  // --- সদস্যকে মেস থেকে রিমুভ করা ---
  const removeMember = async (memberUid: string) => {
    if (!messId || !isManager || memberUid === user?.uid) {
      console.error("Permission denied or cannot remove self.");
      return false;
    }

    // A batch write is safer for multi-step updates
    const batch = writeBatch(db);
    try {
      // 1. Update the user's profile: remove messId and set role to 'pending'
      const userRef = doc(db, "users", memberUid);
      batch.update(userRef, {
        messId: null,
        role: "pending",
      });

      // 2. Optionally: Update mess document (if you track member count/list there)
      // const messRef = doc(db, "messes", messId);
      // batch.update(messRef, { memberCount: increment(-1) });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error removing member:", error);
      return false;
    }
  };

  return { members, loading, updateMemberRole, removeMember, isManager };
};

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
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import { UserProfile } from "../types";

interface MemberData extends UserProfile {
  uid: string;
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

    const usersRef = collection(db, "users");
    const membersQuery = query(
      usersRef,
      where("messId", "==", messId),
      orderBy("displayName", "asc")
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

  const removeMember = async (memberUid: string) => {
    if (!messId || !isManager || memberUid === user?.uid) {
      console.error("Permission denied or cannot remove self.");
      return false;
    }

    const batch = writeBatch(db);
    try {
      const userRef = doc(db, "users", memberUid);
      batch.update(userRef, {
        messId: null,
        role: "pending",
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error removing member:", error);
      return false;
    }
  };

  return { members, loading, updateMemberRole, removeMember, isManager };
};

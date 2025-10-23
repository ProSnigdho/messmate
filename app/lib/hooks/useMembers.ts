import { useState, useEffect } from "react";
import { useAuth } from "../auth-context";
import { UserProfile } from "../types";
import { getMessMembers, updateMemberRole } from "../database";

export const useMembers = () => {
  const { user, isManager } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  const loadMembers = async () => {
    if (!messId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedMembers = await getMessMembers(messId);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [messId]);

  const updateMemberRoleHandler = async (
    memberUid: string,
    newRole: "manager" | "member"
  ): Promise<boolean> => {
    if (!messId || !isManager || memberUid === user?.uid) {
      return false;
    }

    try {
      await updateMemberRole(memberUid, newRole);
      setMembers((prev) =>
        prev.map((member) =>
          member.uid === memberUid ? { ...member, role: newRole } : member
        )
      );
      return true;
    } catch (error) {
      console.error("Error updating role:", error);
      return false;
    }
  };

  return {
    members,
    loading,
    updateMemberRole: updateMemberRoleHandler,
    isManager,
    refreshMembers: loadMembers,
  };
};

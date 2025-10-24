import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../auth-context";
import { message } from "antd";

export interface MessSettings {
  messName: string;
}

export interface UserProfileUpdate {
  displayName: string;
  phoneNumber?: string;
}

export const useSettings = () => {
  const { user, isManager, loading: authLoading, refreshUserData } = useAuth();

  const [messSettings, setMessSettings] = useState<MessSettings | null>(null);
  const [localUserProfile, setLocalUserProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  useEffect(() => {
    setLocalUserProfile(user);
  }, [user]);

  useEffect(() => {
    if (authLoading || !messId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const messDocRef = doc(db, "messes", messId);
        const docSnap = await getDoc(messDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setMessSettings({
            messName: data.name || "Our Mess",
          });
        }
      } catch (error) {
        console.error("Error fetching mess settings:", error);
        message.error("Failed to load mess settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [messId, isManager, authLoading]);

  const updateMessSettings = async (updates: Partial<MessSettings>) => {
    if (!messId || !isManager) {
      message.error("Access Denied or Mess not joined.");
      return false;
    }

    try {
      const messDocRef = doc(db, "messes", messId);

      const messUpdates = {
        ...(updates.messName && { name: updates.messName }),
      };

      if (Object.keys(messUpdates).length === 0) return true;

      await updateDoc(messDocRef, messUpdates);

      setMessSettings((prev) => ({
        ...prev!,
        ...(updates as MessSettings),
      }));

      if (refreshUserData) {
        await refreshUserData();
      }

      message.success("Mess name updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating mess settings:", error);
      message.error("Failed to update mess name.");
      return false;
    }
  };

  const updateProfile = async (updates: Partial<UserProfileUpdate>) => {
    if (!user) {
      message.error("User not authenticated.");
      return false;
    }

    console.log("Attempting to update user profile with:", updates);

    try {
      const userDocRef = doc(db, "users", user.uid);

      await setDoc(userDocRef, updates, { merge: true });

      setLocalUserProfile((prev) => ({
        ...prev!,
        ...updates,
      }));

      if (refreshUserData) {
        await refreshUserData();
      }

      message.success("Profile updated successfully!");
      return true;
    } catch (error) {
      console.error("FIREBASE ERROR: Error updating user profile:", error);
      message.error(
        "Failed to update profile. Check console for specific errors."
      );
      return false;
    }
  };

  return {
    messSettings,
    userProfile: localUserProfile,
    loading: loading || authLoading,
    isManager,
    updateMessSettings,
    updateProfile,
  };
};

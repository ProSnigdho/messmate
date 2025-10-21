// app/lib/hooks/useSettings.ts

import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../auth-context"; // ধরে নিচ্ছি refreshUserData এখানে আছে
import { message } from "antd";

// মেসের সাধারণ সেটিংসের জন্য ইন্টারফেস
export interface MessSettings {
  messName: string;
}

// ইউজার প্রোফাইল আপডেটের জন্য ইন্টারফেস
export interface UserProfileUpdate {
  displayName: string;
  phoneNumber?: string; // phoneNumber অপশনাল করা হলো
}

export const useSettings = () => {
  // ✅ useAuth থেকে refreshUserData ডিস্ট্রাকচার করা হলো
  const { user, isManager, loading: authLoading, refreshUserData } = useAuth();

  const [messSettings, setMessSettings] = useState<MessSettings | null>(null);
  const [localUserProfile, setLocalUserProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const messId = user?.messId;

  // Sync user from auth context to local state
  useEffect(() => {
    setLocalUserProfile(user);
  }, [user]);

  // --- A. ডেটা ফেচিং লজিক (Mess Settings) ---
  useEffect(() => {
    if (authLoading || !messId) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        if (isManager) {
          const messDocRef = doc(db, "messes", messId);
          const docSnap = await getDoc(messDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setMessSettings({
              messName: data.name || "N/A",
            });
          }
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

  // --- B. মেসের সেটিংস আপডেট (শুধুমাত্র ম্যানেজার) ---
  const updateMessSettings = async (updates: Partial<MessSettings>) => {
    if (!messId || !isManager) {
      message.error("Access Denied or Mess not joined.");
      return false;
    }

    try {
      const messDocRef = doc(db, "messes", messId);

      const messUpdates = {
        ...(updates.messName && { name: updates.messName }), // Firestore এ 'name' ফিল্ড
      };

      if (Object.keys(messUpdates).length === 0) return true;

      await updateDoc(messDocRef, messUpdates);

      setMessSettings((prev) => ({
        ...prev!,
        ...(updates as MessSettings),
      }));

      message.success("Mess name updated successfully!");
      return true;
    } catch (error) {
      console.error("Error updating mess settings:", error);
      message.error("Failed to update mess name.");
      return false;
    }
  };

  // --- C. ইউজার প্রোফাইল আপডেট (সবার জন্য) ---
  const updateProfile = async (updates: Partial<UserProfileUpdate>) => {
    if (!user) {
      message.error("User not authenticated.");
      return false;
    }

    console.log("Attempting to update user profile with:", updates);

    try {
      const userDocRef = doc(db, "users", user.uid);

      // ✅ setDoc ব্যবহার করা হলো { merge: true } অপশন সহ
      // এটি ফোন নম্বর এবং ডিসপ্লে নেম উভয়ই সেভ করবে
      await setDoc(userDocRef, updates, { merge: true });

      // 1. লোকাল স্টেট আপডেট করা
      setLocalUserProfile((prev) => ({
        ...prev!,
        ...updates,
      }));

      // 2. ✅ Auth Context-এর ডেটা রিফ্রেশ করা হলো (রিফ্রেশেও ডাটা থাকবে)
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

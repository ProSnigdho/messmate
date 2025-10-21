"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  auth, // 🔥 Firebase Auth
  db, // 🔥 Firebase Firestore
} from "./firebase"; // নিশ্চিত করুন এই পাথটি সঠিক

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// --- Interfaces ---
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "manager" | "member";
  messId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createMess: () => Promise<string>;
  joinMess: (code: string) => Promise<void>;
  loading: boolean;
  isManager: boolean;
  isMember: boolean;
  refreshUserData: () => Promise<void>; // ✅ রিফ্রেশ ফাংশন
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  createMess: async () => "",
  joinMess: async () => {},
  loading: true,
  isManager: false,
  isMember: false,
  refreshUserData: async () => {},
});

// --- Firestore Helpers ---

// 🔥 Firestore থেকে ইউজার ডেটা লোড করার ফাংশন
const fetchUserDocument = async (uid: string): Promise<User | null> => {
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      uid: uid,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber || undefined,
      role: data.role || "member", // default role
      messId: data.messId || undefined,
    } as User;
  }
  return null;
};

// 🔥 Firestore-এ ইউজার ডকুমেন্ট তৈরি বা আপডেট করার ফাংশন
const updateUserDocument = async (userData: User) => {
  const userDocRef = doc(db, "users", userData.uid); // Firestore-এ শুধুমাত্র প্রয়োজনীয় fields গুলো সেট করা হলো
  await setDoc(
    userDocRef,
    {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      messId: userData.messId || null,
    },
    { merge: true }
  );
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const generateSixDigitCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  // 🔑 Helper Function to load and set user data
  const loadAndSetUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userData = await fetchUserDocument(firebaseUser.uid);

      if (userData) {
        setUser(userData);
      } else {
        // নতুন ইউজার: Firestore-এ বেসিক ডেটা তৈরি করা
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "New User",
          role: "member",
          messId: undefined,
        };
        await updateUserDocument(newUser);
        setUser(newUser);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  // --- 1. Session Listener ---
  useEffect(() => {
    // 🔥 onAuthStateChanged ইউজার সেশন পরিবর্তন হলে স্বয়ংক্রিয়ভাবে loadAndSetUser কল করে
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadAndSetUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. Core Auth Functions ---

  // ✅ FIX: manually refresh user data from Firestore
  const refreshUserData = async (): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      setLoading(true);
      // 🔥 সরাসরি loadAndSetUser কল করে ডেটা রিফ্রেশ করা হলো
      await loadAndSetUser(firebaseUser);
    }
    return; // TypeScript error fix
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // 🔥 Firebase Auth Login. onAuthStateChanged handles the rest.
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw new Error("Login failed. Please check your credentials.");
    } finally {
      // loading state is handled by onAuthStateChanged
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    setLoading(true);
    try {
      // 🔥 Firebase Auth Registration
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name }); // Firestore-এ প্রাথমিক ইউজার ডকুমেন্ট তৈরি করা

      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
        role: "member",
        messId: undefined,
      };
      await updateUserDocument(newUser); // setUser state টি onAuthStateChanged হ্যান্ডেল করবে
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      throw new Error(`Registration failed: ${error.message}`);
    } finally {
      // loading state is handled by onAuthStateChanged
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      // 🔥 Firebase Auth Logout
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Logout failed.");
    } finally {
      // loading state is handled by onAuthStateChanged
    }
  }; // --- 3. Mess Management Functions (Firestore Integrated) ---

  const createMess = async (): Promise<string> => {
    if (!user) throw new Error("User must be logged in to create a mess.");

    setLoading(true);
    try {
      const newMessId = generateSixDigitCode(); // Firestore-এ Mess ডকুমেন্ট তৈরি

      const messDocRef = doc(db, "messes", newMessId);
      await setDoc(messDocRef, {
        managerId: user.uid,
        createdAt: new Date(),
        members: [user.uid],
        code: newMessId,
      }); // 🔥 Firestore-এ ইউজার ডকুমেন্ট আপডেট: role to manager এবং messId সেট করা

      const updatedUser: User = { ...user, role: "manager", messId: newMessId };
      await updateUserDocument(updatedUser);

      setUser(updatedUser); // লোকাল state আপডেট করা
      return newMessId;
    } catch (error) {
      console.error("❌ Failed to create mess:", error);
      throw new Error("Mess creation failed.");
    } finally {
      setLoading(false);
    }
  };

  const joinMess = async (code: string): Promise<void> => {
    if (!user) throw new Error("User must be logged in to join a mess.");

    setLoading(true);
    try {
      // Firestore-এ Mess কোডটি ভেরিফাই করা
      const messDocRef = doc(db, "messes", code);
      const messSnap = await getDoc(messDocRef);

      if (!messSnap.exists()) {
        throw new Error("Mess not found or invalid code.");
      } // Mess ডকুমেন্ট আপডেট: মেম্বার লিস্টে ইউজার UID যোগ করা

      const messData = messSnap.data();
      await updateDoc(messDocRef, {
        members: [...messData.members, user.uid],
      }); // 🔥 Firestore-এ ইউজার ডকুমেন্ট আপডেট: messId সেট করা

      const updatedUser: User = { ...user, role: "member", messId: code };
      await updateUserDocument(updatedUser);

      setUser(updatedUser); // লোকাল state আপডেট করা
    } catch (error: any) {
      console.error("❌ Failed to join mess:", error);
      throw new Error(
        `Failed to join mess: ${error.message || "Check the code"}`
      );
    } finally {
      setLoading(false);
    }
  }; // --- Context Value ---

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    createMess,
    joinMess,
    loading,
    isManager: user?.role === "manager",
    isMember: user?.role === "member",
    refreshUserData, // ✅ Context-এ যুক্ত করা হলো
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

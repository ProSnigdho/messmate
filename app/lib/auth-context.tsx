"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "./firebase";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "manager" | "member";
  messId?: string;
  phoneNumber?: string;
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
  refreshUserData: () => Promise<void>;
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
      role: data.role || "member",
      messId: data.messId || undefined,
    } as User;
  }
  return null;
};

const updateUserDocument = async (userData: User) => {
  const userDocRef = doc(db, "users", userData.uid);
  await setDoc(
    userDocRef,
    {
      email: userData.email,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber || null,
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

  const loadAndSetUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userData = await fetchUserDocument(firebaseUser.uid);

      if (userData) {
        setUser(userData);
      } else {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadAndSetUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async (): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      setLoading(true);
      await loadAndSetUser(firebaseUser);
    }
    return;
  };

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw new Error("Login failed. Please check your credentials.");
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
        role: "member",
        messId: undefined,
      };
      await updateUserDocument(newUser);
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Logout failed.");
    }
  };

  const createMess = async (): Promise<string> => {
    if (!user) throw new Error("User must be logged in to create a mess.");

    setLoading(true);
    try {
      const newMessId = generateSixDigitCode();

      const messDocRef = doc(db, "messes", newMessId);
      await setDoc(messDocRef, {
        name: `${user.displayName}'s Mess`,
        managerId: user.uid,
        createdAt: new Date(),
        members: [user.uid],
        code: newMessId,
      });

      const updatedUser: User = { ...user, role: "manager", messId: newMessId };
      await updateUserDocument(updatedUser);

      setUser(updatedUser);
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
      const messDocRef = doc(db, "messes", code);
      const messSnap = await getDoc(messDocRef);

      if (!messSnap.exists()) {
        throw new Error("Mess not found or invalid code.");
      }

      const messData = messSnap.data();
      await updateDoc(messDocRef, {
        members: [...messData.members, user.uid],
      });

      const updatedUser: User = { ...user, role: "member", messId: code };
      await updateUserDocument(updatedUser);

      setUser(updatedUser);
    } catch (error: any) {
      console.error("❌ Failed to join mess:", error);
      throw new Error(
        `Failed to join mess: ${error.message || "Check the code"}`
      );
    } finally {
      setLoading(false);
    }
  };

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
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

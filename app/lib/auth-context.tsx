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
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  applyActionCode,
} from "firebase/auth";

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile } from "../lib/types";

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createMess: () => Promise<string>;
  joinMess: (code: string) => Promise<void>;
  loading: boolean;
  isManager: boolean;
  isMember: boolean;
  refreshUserData: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  isVerificationCooldown: boolean;
  verificationCooldown: number;
  verifyEmail: (actionCode: string) => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
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
  resendVerification: async () => {},
  isVerificationCooldown: false,
  verificationCooldown: 0,
  verifyEmail: async () => {},
  checkEmailVerified: async () => false,
});

const fetchUserDocument = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: uid,
      uid: uid,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      role: data.role || "member",
      messId: data.messId || null,
      emailVerified: data.emailVerified || false,
      monthlyRent: data.monthlyRent || 0,
      customRent: data.customRent || 0,
      totalRent: data.totalRent || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      photoURL: data.photoURL,
    } as UserProfile;
  }
  return null;
};

const updateUserDocument = async (userData: UserProfile) => {
  const userDocRef = doc(db, "users", userData.uid);
  await setDoc(
    userDocRef,
    {
      email: userData.email,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber || null,
      role: userData.role,
      messId: userData.messId || null,
      emailVerified: userData.emailVerified || false,
      monthlyRent: userData.monthlyRent || 0,
      customRent: userData.customRent || 0,
      totalRent: userData.totalRent || 0,
      photoURL: userData.photoURL || null,
      updatedAt: new Date(),
    },
    { merge: true }
  );
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [isVerificationCooldown, setIsVerificationCooldown] = useState(false);
  const [hasCheckedVerification, setHasCheckedVerification] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (verificationCooldown > 0) {
      setIsVerificationCooldown(true);
      interval = setInterval(() => {
        setVerificationCooldown((prev) => {
          if (prev <= 1) {
            setIsVerificationCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsVerificationCooldown(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [verificationCooldown]);

  const generateSixDigitCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const loadAndSetUser = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userData = await fetchUserDocument(firebaseUser.uid);

      if (userData) {
        const updatedUserData: UserProfile = {
          ...userData,
          emailVerified: firebaseUser.emailVerified,
        };
        setUser(updatedUserData);

        if (userData.emailVerified !== firebaseUser.emailVerified) {
          await updateUserDocument(updatedUserData);
        }
      } else {
        const newUser: UserProfile = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "New User",
          role: "member",
          messId: null,
          emailVerified: firebaseUser.emailVerified,
          monthlyRent: 0,
          customRent: 0,
          totalRent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await updateUserDocument(newUser);
        setUser(newUser);
      }

      setHasCheckedVerification(true);
    } else {
      setUser(null);
      setHasCheckedVerification(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      loadAndSetUser(firebaseUser).then(() => {
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async (): Promise<void> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      setLoading(true);
      await firebaseUser.reload();
      await loadAndSetUser(firebaseUser);
      setLoading(false);
    }
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await firebaseUser.reload();
      return firebaseUser.emailVerified;
    }
    return false;
  };

  const resendVerification = async (email: string): Promise<void> => {
    try {
      if (auth.currentUser && auth.currentUser.email === email) {
        await sendEmailVerification(auth.currentUser);

        setVerificationCooldown(30);
      } else {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          throw new Error(
            "Please try logging in first to resend verification."
          );
        } else {
          throw new Error("No account found with this email.");
        }
      }
    } catch (error: any) {
      if (error.code === "auth/too-many-requests") {
        throw new Error("Too many attempts. Please try again later.");
      } else {
        throw new Error(
          error.message ||
            "Failed to send verification email. Please try again."
        );
      }
    }
  };

  const verifyEmail = async (actionCode: string): Promise<void> => {
    try {
      await applyActionCode(auth, actionCode);

      if (auth.currentUser) {
        await auth.currentUser.reload();
        await refreshUserData();
      }
    } catch (error: any) {
      console.error("Email verification failed:", error);
      throw new Error(
        error.message ||
          "Email verification failed. The link may be invalid or expired."
      );
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await firebaseUser.reload();
        await refreshUserData();
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error);

      if (error.code === "auth/invalid-credential") {
        throw new Error(
          "Invalid email or password. Please check your credentials."
        );
      } else if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please try again later.");
      } else {
        throw new Error("Login failed. Please check your credentials.");
      }
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      await sendEmailVerification(firebaseUser);

      const newUser: UserProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: name,
        role: "member",
        messId: null,
        emailVerified: false,
        monthlyRent: 0,
        customRent: 0,
        totalRent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await updateUserDocument(newUser);

      setVerificationCooldown(30);
    } catch (error: any) {
      console.error("❌ Registration failed:", error);

      if (error.code === "auth/email-already-in-use") {
        throw new Error("An account with this email already exists.");
      } else if (error.code === "auth/weak-password") {
        throw new Error(
          "Password is too weak. Please use a stronger password."
        );
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address format.");
      } else {
        throw new Error(`Registration failed: ${error.message}`);
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setHasCheckedVerification(false);

      setVerificationCooldown(0);
      setIsVerificationCooldown(false);
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

      const updatedUser: UserProfile = {
        ...user,
        role: "manager",
        messId: newMessId,
      };
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

      const updatedUser: UserProfile = {
        ...user,
        role: "member",
        messId: code,
      };
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
    resendVerification,
    isVerificationCooldown,
    verificationCooldown,
    verifyEmail,
    checkEmailVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

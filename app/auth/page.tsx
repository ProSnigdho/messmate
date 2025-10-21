// app/(auth)/page.tsx (Final Fixed with Advanced Redirect Check)
"use client";

import React, { useState, useEffect } from "react";
import { Button, Divider, Typography, message, Alert, Spin } from "antd";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/layout/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuth, User } from "../lib/auth-context"; // User interface ইমপোর্ট করা হয়েছে

const { Text } = Typography;

interface LoginValues {
  email: string;
  password: string;
  [key: string]: any;
}

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { user, loading, login, register } = useAuth();

  // --- ১. ইমিডিয়েট রিডাইরেক্ট লজিক (কম্পোনেন্ট লোডের সময়) ---
  useEffect(() => {
    if (loading) return;

    if (user && user.messId) {
      router.replace("/dashboard");
    } else if (user && !user.messId) {
      router.replace("/onboarding");
    }
  }, [user, loading, router]);

  // যদি user অলরেডি লগইন থাকে এবং messId চেক করার জন্য লোডিং হয়
  if (loading || (user && user.messId)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
        <Text type="secondary" style={{ marginLeft: 16 }}>
          Checking session...
        </Text>
      </div>
    );
  }

  // --- ২. Login Handler (ফাংশন কলের পর) ---
  const handleDevLogin = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const { email, password } = values;

      // await login(email, password) কল হলো এবং লোকাল স্টোরেজে ডেটা সেভ হলো
      await login(email, password);
      message.success("Login successful! Checking mess status...");

      // 🔥 FIX: login সফল হওয়ার পর, লেটেস্ট user ডেটা নিয়ে messId চেক করা
      // লোকাল স্টোরেজ থেকে ডেটা নিয়ে User টাইপে কাস্ট করা
      const userAfterLogin: User | null = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (userAfterLogin && userAfterLogin.messId) {
        router.replace("/dashboard"); // যদি Mess থাকে, ড্যাশবোর্ড
      } else {
        router.replace("/onboarding"); // যদি Mess না থাকে, অনবোর্ডিং
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      message.error(`Login failed: ${error.message || "Check credentials"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Register Handler ---
  const handleDevRegister = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      await register(values.name, values.email, values.password);
      message.success("Registration successful! Redirecting to setup...");
      router.replace("/onboarding");
    } catch (error: any) {
      console.error("Registration failed:", error);
      message.error(`Registration failed: ${error.message || "Server error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {isLogin ? (
        <LoginForm onFinish={handleDevLogin} loading={isLoading} />
      ) : (
        <RegisterForm onFinish={handleDevRegister} loading={isLoading} />
      )}

      <Divider plain style={{ margin: "15px 0 15px 0" }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {isLogin ? "DON'T HAVE AN ACCOUNT?" : "ALREADY HAVE AN ACCOUNT?"}
        </Text>
      </Divider>

      <Button
        type="default"
        block
        onClick={() => setIsLogin(!isLogin)}
        style={{
          height: 45,
          color: "#004d40",
          borderColor: "#004d40",
          fontWeight: "bold",
        }}
      >
        {isLogin ? "Create Account" : "Back to Sign In"}
      </Button>
    </AuthLayout>
  );
};

export default AuthPage;

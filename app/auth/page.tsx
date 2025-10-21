"use client";

import React, { useState, useEffect } from "react";
import { Button, Divider, Typography, message, Alert, Spin } from "antd";
import { useRouter } from "next/navigation";
import AuthLayout from "../components/layout/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuth, User } from "../lib/auth-context";

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

  useEffect(() => {
    if (loading) return;

    if (user && user.messId) {
      router.replace("/dashboard");
    } else if (user && !user.messId) {
      router.replace("/onboarding");
    }
  }, [user, loading, router]);

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

  const handleDevLogin = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const { email, password } = values;

      await login(email, password);
      message.success("Login successful! Checking mess status...");

      const userAfterLogin: User | null = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (userAfterLogin && userAfterLogin.messId) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      message.error(`Login failed: ${error.message || "Check credentials"}`);
    } finally {
      setIsLoading(false);
    }
  };

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

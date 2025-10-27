"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Divider,
  Typography,
  message,
  Alert,
  Spin,
  Card,
  Space,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "../components/layout/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import { useAuth } from "../lib/auth-context";

const { Text, Title } = Typography;

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

const Login: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [isProcessingVerification, setIsProcessingVerification] =
    useState(false);
  const [cameFromVerification, setCameFromVerification] = useState(false);

  const [authSuccess, setAuthSuccess] = useState<"login" | "register" | null>(
    null
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    user,
    loading,
    login,
    register,
    resendVerification,
    isVerificationCooldown,
    verificationCooldown,
    verifyEmail,
    checkEmailVerified,
    logout,
  } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user && user.emailVerified) {
      if (authSuccess === "login") {
        messageApi.success("Login successful! Redirecting...");
      }
      setAuthSuccess(null);

      if (user.messId) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
      return;
    }

    if (
      user &&
      !user.emailVerified &&
      !showVerificationAlert &&
      !cameFromVerification
    ) {
      setShowVerificationAlert(true);
      setPendingEmail(user.email);
    }

    if (cameFromVerification) {
      setCameFromVerification(false);
    }
  }, [
    user,
    loading,
    router,
    showVerificationAlert,
    cameFromVerification,
    authSuccess,
    messageApi,
  ]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (showVerificationAlert) {
        messageApi.info("Please complete email verification to continue.");
        handleForceLogout();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showVerificationAlert, messageApi]);

  const handleForceLogout = async () => {
    try {
      await logout();
      setShowVerificationAlert(false);
      setCameFromVerification(true);
      messageApi.info("Please verify your email and login again.");
    } catch (error) {
      console.error("Logout failed:", error);
      messageApi.error("Logout failed unexpectedly.");
    }
  };

  useEffect(() => {
    const mode = searchParams.get("mode");
    const actionCode = searchParams.get("oobCode");

    if (mode === "verifyEmail" && actionCode && !isProcessingVerification) {
      handleEmailVerification(actionCode);
    }
  }, [searchParams, isProcessingVerification]);

  const handleEmailVerification = async (actionCode: string) => {
    setIsProcessingVerification(true);
    setIsLoading(true);
    try {
      await verifyEmail(actionCode);
      setVerificationStatus("success");
      messageApi.success("Email verified successfully! Redirecting...");

      setTimeout(async () => {
        const isVerified = await checkEmailVerified();
        if (isVerified) {
          setAuthSuccess("login");
        } else {
          setIsLogin(true);
          setVerificationStatus("idle");
        }
      }, 2000);
    } catch (error: any) {
      setVerificationStatus("error");
      messageApi.error(error.message || "Email verification failed.");
    } finally {
      setIsLoading(false);
      setIsProcessingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) {
      messageApi.error("No email found to resend verification.");
      return;
    }

    if (isVerificationCooldown) {
      messageApi.warning(
        `Please wait ${verificationCooldown} seconds before resending.`
      );
      return;
    }

    setIsLoading(true);
    try {
      await resendVerification(pendingEmail);
      messageApi.success(
        "Verification email sent successfully! Please check your inbox."
      );
    } catch (error: any) {
      if (error?.message?.includes("Please log in first")) {
        messageApi.error("Please log in first to resend verification email.");
      } else if (error?.message?.includes("No account found")) {
        messageApi.error(
          "No account found with this email. Please register first."
        );
      } else if (error?.message?.includes("Too many attempts")) {
        messageApi.error("Too many resend attempts. Please try again later.");
      } else {
        messageApi.error(
          error?.message || "Failed to resend verification email."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationStatus === "success") {
    return (
      <AuthLayout>
        {contextHolder}
        <Card style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <Title level={3} style={{ color: "#52c41a" }}>
            Email Verified Successfully!
          </Title>
          <Alert
            message="Verification Complete"
            description="Your email has been successfully verified. Redirecting you to the app..."
            type="success"
            showIcon
            style={{ marginBottom: 20 }}
          />
          <Spin size="large" />
          <Text style={{ display: "block", marginTop: 16 }}>
            Please wait while we redirect you...
          </Text>
        </Card>
      </AuthLayout>
    );
  }

  if (verificationStatus === "error") {
    return (
      <AuthLayout>
        {contextHolder}
        <Card style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <Title level={3} style={{ color: "#ff4d4f" }}>
            Verification Failed
          </Title>
          <Alert
            message="Verification Error"
            description="The verification link is invalid or has expired. Please request a new verification email."
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
          <Button
            type="primary"
            size="large"
            onClick={() => {
              setVerificationStatus("idle");
              setIsLogin(true);
            }}
            style={{ width: "100%" }}
          >
            Back to Login
          </Button>
        </Card>
      </AuthLayout>
    );
  }

  if (loading) {
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

  if (showVerificationAlert && user && !user.emailVerified) {
    return (
      <AuthLayout>
        {contextHolder}
        <Card style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <Title level={3} style={{ color: "#1890ff" }}>
            Verify Your Email
          </Title>
          <Alert
            message="Email Verification Required"
            description={
              <Space direction="vertical" size="small">
                <Text>
                  Please verify your email address to continue using Mess
                  Manager.
                </Text>
                <Text strong>
                  We've sent a verification link to: {pendingEmail}
                </Text>
                <Text
                  type="warning"
                  style={{ fontSize: "12px", display: "block", marginTop: 8 }}
                >
                  ⚠️ You must verify your email before accessing the app.
                </Text>
              </Space>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <Space
            direction="vertical"
            style={{ width: "100%", marginBottom: 20 }}
          >
            <Text type="secondary">Didn't receive the email?</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Check your spam folder or click below to resend the verification
              link.
            </Text>
          </Space>

          <Button
            type="primary"
            size="large"
            loading={isLoading}
            onClick={handleResendVerification}
            disabled={isVerificationCooldown}
            style={{ marginBottom: 10, width: "100%" }}
          >
            {isVerificationCooldown
              ? `Resend in ${verificationCooldown}s`
              : "Resend Verification Email"}
          </Button>

          <Button
            type="default"
            size="large"
            onClick={handleForceLogout}
            style={{ width: "100%" }}
          >
            Sign Out
          </Button>
        </Card>
      </AuthLayout>
    );
  }

  const handleDevLogin = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const { email, password } = values;

      await login(email, password);

      const isVerified = await checkEmailVerified();

      if (!isVerified) {
        setPendingEmail(email);
        setShowVerificationAlert(true);
        messageApi.warning("Please verify your email to continue.");
        return;
      }

      setAuthSuccess("login");
    } catch (error: any) {
      console.error("Login failed:", error);
      messageApi.error(`Login failed: ${error.message || "Check credentials"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevRegister = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      await register(values.name, values.email, values.password);

      messageApi.success(
        "Registration successful! Please check your email for verification."
      );

      setPendingEmail(values.email);
      setShowVerificationAlert(true);
    } catch (error: any) {
      console.error("Registration failed:", error);
      messageApi.error(
        `Registration failed: ${error.message || "Server error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {contextHolder}

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

export default Login;

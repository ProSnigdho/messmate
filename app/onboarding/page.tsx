// app/onboarding/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Row, Typography, Space, message, Spin } from "antd";
import { PlusOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context"; // এই পাথটি আপনার lib ফোল্ডারের জন্য সঠিক কিনা নিশ্চিত করুন।

const { Title, Text } = Typography;

const OnboardingPage: React.FC = () => {
  const router = useRouter();

  // AuthContext থেকে user, loading, createMess, joinMess ফাংশন নেওয়া হলো
  // user.messId চেক করার জন্য user-কে প্রয়োজন
  const { user, loading, createMess, joinMess } = useAuth();

  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  // 1. রিডাইরেক্ট লজিক (অনবোর্ডিং বাইপাস)
  useEffect(() => {
    // Auth context loading শেষ না হওয়া পর্যন্ত অপেক্ষা করুন
    if (loading) return;

    // 🔥 FIX: user?.messId ব্যবহার করা হয়েছে
    // যদি ইউজার লগইন থাকে এবং তার messId সেট করা থাকে, তবে ড্যাশবোর্ডে রিডাইরেক্ট করুন
    if (user && user.messId) {
      message.info("You've already joined a mess. Redirecting to dashboard.");
      router.replace("/dashboard");
    }
    // যদি ইউজার লগইন না থাকে, তবে লগইন পেজে পাঠান (সুরক্ষার জন্য)
    if (!user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  // লোডিং অবস্থায় বা রিডাইরেক্ট হওয়ার সময়
  // যদি user থাকে but messId না থাকে, তবেই ফর্ম দেখানো হবে।
  if (loading || (user && user.messId) || !user) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" tip="Checking mess status..." />
      </div>
    );
  }

  // Create Mess হ্যান্ডলার
  const handleCreateMess = async () => {
    try {
      // createMess ফাংশন কল করা হলো
      const messId = await createMess();
      message.success(
        `Mess created successfully! Code: ${messId}. Redirecting...`
      );
      router.replace("/dashboard");
    } catch (error) {
      message.error("Failed to create mess. Please try again.");
      console.error(error);
    }
  };

  // Join Mess হ্যান্ডলার
  const handleJoinMess = async () => {
    if (joinCode.length !== 6) {
      message.error("Please enter a valid 6-digit code.");
      return;
    }
    try {
      // joinMess ফাংশন কল করা হলো
      await joinMess(joinCode);
      message.success("Joined mess successfully! Redirecting to dashboard.");
      router.replace("/dashboard");
    } catch (error) {
      message.error("Failed to join mess. Check the code.");
      console.error(error);
    }
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "50px auto",
        padding: 20,
        textAlign: "center",
      }}
    >
      <Title level={2}>Welcome to MessMate!</Title>
      <Text type="secondary" style={{ marginBottom: 40, display: "block" }}>
        Start by creating a new mess or joining an existing one.
      </Text>

      <Row gutter={24}>
        {/* Left Side: Create Mess */}
        <Col span={12}>
          <Card
            hoverable
            onClick={handleCreateMess}
            style={{
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderColor: "#004d40",
            }}
          >
            <Space direction="vertical" align="center">
              <PlusOutlined style={{ fontSize: 48, color: "#004d40" }} />
              <Title level={4}>Create New Mess</Title>
              <Text>Become the manager and get a unique 6-digit code.</Text>
            </Space>
          </Card>
        </Col>

        {/* Right Side: Join Mess */}
        <Col span={12}>
          <Card
            hoverable
            onClick={() => setIsJoining(true)}
            style={{
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderColor: "#004d40",
            }}
          >
            {!isJoining ? (
              <Space direction="vertical" align="center">
                <UsergroupAddOutlined
                  style={{ fontSize: 48, color: "#004d40" }}
                />
                <Title level={4}>Join Existing Mess</Title>
                <Text>Use the 6-digit code shared by your manager.</Text>
              </Space>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit Code"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  style={{
                    padding: "10px",
                    fontSize: "18px",
                    textAlign: "center",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    width: "100%",
                  }}
                />
                <Button
                  type="primary"
                  onClick={handleJoinMess}
                  block
                  style={{ background: "#004d40", borderColor: "#004d40" }}
                >
                  Join Mess
                </Button>
                <Button type="link" onClick={() => setIsJoining(false)}>
                  Back
                </Button>
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OnboardingPage;

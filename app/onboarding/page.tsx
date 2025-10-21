"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Row, Typography, Space, message, Spin } from "antd";
import { PlusOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";

const { Title, Text } = Typography;

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const { user, loading, createMess, joinMess } = useAuth();

  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (loading) return;
    if (user && user.messId) {
      message.info("You've already joined a mess. Redirecting to dashboard.");
      router.replace("/dashboard");
    }
    if (!user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

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

  const handleCreateMess = async () => {
    try {
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

  const handleJoinMess = async () => {
    if (joinCode.length !== 6) {
      message.error("Please enter a valid 6-digit code.");
      return;
    }
    try {
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

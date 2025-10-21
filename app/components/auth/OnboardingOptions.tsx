import React, { useState } from "react";
import { Card, Button, Typography, Row, Col, Input, Form, message } from "antd";
import {
  PlusCircleOutlined,
  UsergroupAddOutlined,
  QrcodeOutlined,
  CoffeeOutlined,
  CopyOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface OnboardingOptionsProps {
  onCreateMess: (messName: string) => void;
  onJoinMess: (messCode: string) => void;
  loading: boolean;
}

const OnboardingOptions: React.FC<OnboardingOptionsProps> = ({
  onCreateMess,
  onJoinMess,
  loading,
}) => {
  const [createdMessCode, setCreatedMessCode] = useState<string | null>(null);

  const handleCreateSuccess = (messName: string) => {
    onCreateMess(messName);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Code copied to clipboard!");
  };

  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <Title level={2} style={{ color: "#004d40", marginBottom: 10 }}>
        Welcome to MessMate! 🎉
      </Title>
      <Text
        type="secondary"
        style={{ display: "block", marginBottom: 40, fontSize: 16 }}
      >
        Let's get you connected to a mess. Create a new one or join an existing
        mess.
      </Text>

      <Row gutter={[32, 32]} justify="center">
        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              minHeight: 320,
              borderLeft: "5px solid #004d40",
              textAlign: "left",
              borderRadius: 8,
            }}
            styles={{
              body: {
                padding: 25,
              },
            }}
          >
            <Title level={4} style={{ margin: "0 0 15px 0", color: "#004d40" }}>
              <PlusCircleOutlined /> Start a New Mess
            </Title>

            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 20 }}
            >
              Create your own mess and invite others to join. You'll be the
              manager.
            </Text>

            <Form
              onFinish={({ messName }) => handleCreateSuccess(messName)}
              layout="vertical"
            >
              <Form.Item
                name="messName"
                rules={[
                  {
                    required: true,
                    message: "Please enter a name for your Mess!",
                  },
                  {
                    min: 3,
                    message: "Mess name should be at least 3 characters",
                  },
                ]}
                style={{ marginBottom: 15 }}
              >
                <Input
                  placeholder="e.g., Bachelor's Den, Foodie Paradise"
                  style={{ height: 40 }}
                  prefix={<CoffeeOutlined style={{ color: "#b0bec5" }} />}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 45,
                  backgroundColor: "#004d40",
                  borderColor: "#004d40",
                  fontWeight: "bold",
                }}
              >
                Create Mess
              </Button>
            </Form>

            <div
              style={{
                marginTop: 15,
                padding: 12,
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 6,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 You'll get a unique 6-digit code to share with members
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              minHeight: 320,
              borderLeft: "5px solid #FF8F00",
              textAlign: "left",
              borderRadius: 8,
            }}
            styles={{
              body: {
                padding: 25,
              },
            }}
          >
            <Title level={4} style={{ margin: "0 0 15px 0", color: "#FF8F00" }}>
              <UsergroupAddOutlined /> Join Existing Mess
            </Title>

            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 20 }}
            >
              Already have a mess code? Enter it below to join your friends.
            </Text>

            <Form
              onFinish={({ messCode }) => onJoinMess(messCode)}
              layout="vertical"
            >
              <Form.Item
                name="messCode"
                rules={[
                  {
                    required: true,
                    message: "Please enter the 6-digit Mess Code!",
                  },
                  {
                    len: 6,
                    message: "Code must be exactly 6 characters.",
                  },
                  {
                    pattern: /^[A-Z0-9]{6}$/,
                    message: "Code must be 6 uppercase letters or numbers",
                  },
                ]}
                style={{ marginBottom: 15 }}
              >
                <Input
                  placeholder="Enter 6-Digit Code (e.g., A1B2C3)"
                  maxLength={6}
                  style={{ height: 40, textTransform: "uppercase" }}
                  prefix={<QrcodeOutlined style={{ color: "#b0bec5" }} />}
                  onChange={(e) => {
                    e.target.value = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "");
                  }}
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 45,
                  backgroundColor: "#FF8F00",
                  borderColor: "#FF8F00",
                  fontWeight: "bold",
                }}
              >
                Join Mess
              </Button>
            </Form>

            <div
              style={{
                marginTop: 15,
                padding: 12,
                background: "#fff7e6",
                border: "1px solid #ffd591",
                borderRadius: 6,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                🔍 Ask your mess manager for the 6-digit code
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <div
        style={{
          marginTop: 40,
          padding: 20,
          background: "#f0f8ff",
          borderRadius: 8,
        }}
      >
        <Title level={4} style={{ color: "#1890ff", marginBottom: 10 }}>
          How It Works 🤔
        </Title>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>1️⃣</div>
              <Text strong>Create or Join</Text>
              <br />
              <Text type="secondary">
                Create a new mess or join existing one with code
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>2️⃣</div>
              <Text strong>Share Code</Text>
              <br />
              <Text type="secondary">
                Share your unique 6-digit code with members
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>3️⃣</div>
              <Text strong>Manage Together</Text>
              <br />
              <Text type="secondary">
                Track meals, expenses, and manage your mess
              </Text>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default OnboardingOptions;

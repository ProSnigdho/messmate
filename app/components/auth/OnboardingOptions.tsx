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
        padding: "20px",
        textAlign: "center",
        maxWidth: 800,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <Title
        level={2}
        style={{
          color: "#004d40",
          marginBottom: 10,
          fontSize: "24px",
        }}
      >
        Welcome to MessMate! 🎉
      </Title>
      <Text
        type="secondary"
        style={{
          display: "block",
          marginBottom: 30,
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        Let's get you connected to a mess. Create a new one or join an existing
        mess.
      </Text>

      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              minHeight: "auto",
              borderLeft: "5px solid #004d40",
              textAlign: "left",
              borderRadius: 8,
              height: "100%",
            }}
            styles={{
              body: {
                padding: "20px",
              },
            }}
          >
            <Title
              level={4}
              style={{
                margin: "0 0 15px 0",
                color: "#004d40",
                fontSize: "18px",
              }}
            >
              <PlusCircleOutlined /> Start a New Mess
            </Title>

            <Text
              type="secondary"
              style={{
                display: "block",
                marginBottom: 20,
                fontSize: "14px",
                lineHeight: 1.5,
              }}
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
                  style={{
                    height: 40,
                    fontSize: "14px",
                  }}
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
                  fontSize: "14px",
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
              <Text type="secondary" style={{ fontSize: "12px" }}>
                💡 You'll get a unique 6-digit code to share with members
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            hoverable
            style={{
              minHeight: "auto",
              borderLeft: "5px solid #FF8F00",
              textAlign: "left",
              borderRadius: 8,
              height: "100%",
            }}
            styles={{
              body: {
                padding: "20px",
              },
            }}
          >
            <Title
              level={4}
              style={{
                margin: "0 0 15px 0",
                color: "#FF8F00",
                fontSize: "18px",
              }}
            >
              <UsergroupAddOutlined /> Join Existing Mess
            </Title>

            <Text
              type="secondary"
              style={{
                display: "block",
                marginBottom: 20,
                fontSize: "14px",
                lineHeight: 1.5,
              }}
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
                  style={{
                    height: 40,
                    textTransform: "uppercase",
                    fontSize: "14px",
                  }}
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
                  fontSize: "14px",
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
              <Text type="secondary" style={{ fontSize: "12px" }}>
                🔍 Ask your mess manager for the 6-digit code
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <div
        style={{
          marginTop: 30,
          padding: 20,
          background: "#f0f8ff",
          borderRadius: 8,
        }}
      >
        <Title
          level={4}
          style={{
            color: "#1890ff",
            marginBottom: 15,
            fontSize: "18px",
          }}
        >
          How It Works 🤔
        </Title>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} sm={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>1️⃣</div>
              <Text strong style={{ fontSize: "14px" }}>
                Create or Join
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Create a new mess or join existing one with code
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>2️⃣</div>
              <Text strong style={{ fontSize: "14px" }}>
                Share Code
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Share your unique 6-digit code with members
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>3️⃣</div>
              <Text strong style={{ fontSize: "14px" }}>
                Manage Together
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Track meals, expenses, and manage your mess
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Mobile-specific responsive styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .ant-card {
            margin-bottom: 16px;
          }

          .ant-typography h2 {
            font-size: 20px !important;
          }

          .ant-typography h4 {
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .ant-card-body {
            padding: 16px !important;
          }

          .ant-row {
            margin-left: -8px !important;
            margin-right: -8px !important;
          }

          .ant-col {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingOptions;

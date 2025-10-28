"use client";

import React, { useState } from "react";
import {
  Card,
  Typography,
  Spin,
  Form,
  Input,
  Button,
  Tabs,
  Row,
  Col,
  message,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  SettingOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  useSettings,
  MessSettings,
  UserProfileUpdate,
} from "../../lib/hooks/useSettings";

const { Title, Text } = Typography;

const PRIMARY_COLOR = "#00695C";
const ACCENT_COLOR_PROFILE = "#00897b";
const ACCENT_COLOR_MESS = "#ff8f00";

const UserProfileForm: React.FC<{
  user: any;
  updateProfile: (updates: Partial<UserProfileUpdate>) => Promise<boolean>;
}> = ({ user, updateProfile }) => {
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const initialValues = {
    displayName: user.displayName || "",
    phoneNumber: user.phoneNumber || "",
  };

  const onFinish = async (values: UserProfileUpdate) => {
    setSubmitting(true);
    const success = await updateProfile(values);
    setSubmitting(false);

    if (success) {
      message.success("Profile updated successfully!");
    } else {
      message.error("Failed to update profile.");
    }
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
          <UserOutlined style={{ marginRight: 8 }} /> Your Profile Details
        </Title>
      }
      variant="borderless"
      style={{
        backgroundColor: "#f7fcfc",
        borderRadius: "8px",
        borderLeft: `4px solid ${ACCENT_COLOR_PROFILE}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      }}
      styles={{
        body: { padding: "24px 16px" },
      }}
    >
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={initialValues}
            requiredMark={false}
          >
            <Form.Item label="Email (Read-Only)">
              <Input
                value={user.email}
                disabled
                style={{ backgroundColor: "#e8e8e8", color: "#595959" }}
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="displayName"
              label="Display Name"
              rules={[
                { required: true, message: "Please enter your display name" },
              ]}
            >
              <Input
                placeholder="Your Name"
                size="large"
                prefix={
                  <UserOutlined style={{ color: ACCENT_COLOR_PROFILE }} />
                }
              />
            </Form.Item>
            <Form.Item
              name="phoneNumber"
              label="Phone Number"
              rules={[
                {
                  pattern: /^\+?[0-9]{5,15}$/,
                  message:
                    "Please enter a valid phone number (only digits and + allowed)!",
                },
              ]}
            >
              <Input
                placeholder="e.g., 017xxxxxxxx"
                size="large"
                prefix={<i className="anticon">+88</i>}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                block
                size="large"
                icon={<SaveOutlined />}
                style={{
                  height: 45,
                  fontWeight: "bold",
                  backgroundColor: PRIMARY_COLOR,
                  borderColor: PRIMARY_COLOR,
                }}
              >
                Save Profile Updates
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Card>
  );
};

const MessSettingsForm: React.FC<{
  settings: MessSettings | null;
  updateMessSettings: (updates: Partial<MessSettings>) => Promise<boolean>;
}> = ({ settings, updateMessSettings }) => {
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  if (!settings) {
    return (
      <Row justify="center" style={{ padding: "50px 0" }}>
        <Spin tip="Loading Mess settings..." size="large" />
      </Row>
    );
  }

  const onFinish = async (values: MessSettings) => {
    setSubmitting(true);
    const success = await updateMessSettings(values);
    setSubmitting(false);

    if (success) {
      message.success("Mess Settings updated successfully!");
    } else {
      message.error("Failed to update Mess Settings.");
    }
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: ACCENT_COLOR_MESS }}>
          <HomeOutlined style={{ marginRight: 8 }} /> Mess General Settings
        </Title>
      }
      variant="borderless"
      style={{
        backgroundColor: "#fffdf9",
        borderRadius: "8px",
        borderLeft: `4px solid ${ACCENT_COLOR_MESS}`,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      }}
      styles={{
        body: { padding: "24px 16px" },
      }}
    >
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={settings}
            requiredMark={false}
          >
            <Form.Item
              name="messName"
              label="Mess Name"
              rules={[{ required: true, message: "Please enter a Mess Name" }]}
            >
              <Input
                placeholder="Enter your mess name"
                size="large"
                prefix={<HomeOutlined style={{ color: ACCENT_COLOR_MESS }} />}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                block
                size="large"
                icon={<SaveOutlined />}
                style={{
                  height: 45,
                  fontWeight: "bold",
                  backgroundColor: ACCENT_COLOR_MESS,
                  borderColor: ACCENT_COLOR_MESS,
                }}
              >
                Save Mess Settings
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </Card>
  );
};

export default function SettingsPage() {
  const {
    userProfile,
    messSettings,
    loading,
    isManager,
    updateMessSettings,
    updateProfile,
  } = useSettings();

  if (loading || !userProfile) {
    return (
      <Row justify="center" style={{ minHeight: "80vh", alignItems: "center" }}>
        <Spin tip="Loading Settings..." size="large" />
      </Row>
    );
  }

  const items = [
    {
      key: "1",
      label: (
        <span style={{ color: PRIMARY_COLOR, fontWeight: "bold" }}>
          <UserOutlined /> Profile
        </span>
      ),
      children: (
        <UserProfileForm user={userProfile} updateProfile={updateProfile} />
      ),
    },
  ];

  if (isManager) {
    items.push({
      key: "2",
      label: (
        <span style={{ color: PRIMARY_COLOR, fontWeight: "bold" }}>
          <HomeOutlined /> Mess Settings
        </span>
      ),
      children: (
        <MessSettingsForm
          settings={messSettings}
          updateMessSettings={updateMessSettings}
        />
      ),
    });
  }

  return (
    <div style={{ padding: "20px 0" }}>
      <Card
        className="shadow-2xl"
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          maxWidth: 1200,
          margin: "0 auto",
        }}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div
          style={{
            padding: "24px 24px 0",
            borderBottom: `1px solid ${PRIMARY_COLOR}`,
          }}
        >
          <Title
            level={2}
            style={{
              margin: 0,
              color: PRIMARY_COLOR,
              display: "flex",
              alignItems: "center",
            }}
          >
            <SettingOutlined style={{ marginRight: 10 }} /> App Settings
          </Title>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 20, fontSize: "16px" }}
          >
            Manage your **personal profile** and the **mess configuration**.
          </Text>
        </div>

        <Tabs
          defaultActiveKey="1"
          items={items}
          size="large"
          style={{ padding: "0 24px" }}
          tabBarStyle={{
            marginBottom: 0,
            borderBottom: "none",
          }}
          indicator={{
            size: (origin) => origin - 16,
          }}
        ></Tabs>

        {!isManager && (
          <Row
            justify="center"
            style={{ padding: "20px 0", borderTop: "1px solid #f0f0f0" }}
          >
            <Col>
              <Text type="danger" strong style={{ fontSize: "14px" }}>
                (👑 Only Manager can see and edit Mess Settings Tab)
              </Text>
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
}

// components/dashboard/SettingsPage.tsx

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
} from "antd";
import { UserOutlined, HomeOutlined, SettingOutlined } from "@ant-design/icons";
import {
  useSettings,
  MessSettings,
  UserProfileUpdate,
} from "../../lib/hooks/useSettings";

const { Title, Text } = Typography;

// --- A. User Profile Form (সবার জন্য) ---
const UserProfileForm: React.FC<{
  user: any;
  updateProfile: (updates: Partial<UserProfileUpdate>) => Promise<boolean>;
}> = ({ user, updateProfile }) => {
  const [submitting, setSubmitting] = useState(false);

  // Form Initial Values নিশ্চিত করা
  const initialValues = {
    displayName: user.displayName || "",
    // user.phoneNumber সরাসরি Auth Context থেকে নাও আসতে পারে,
    // কিন্তু useSettings localUserProfile থেকে আসবে
    phoneNumber: user.phoneNumber || "",
  };

  const onFinish = async (values: UserProfileUpdate) => {
    setSubmitting(true);
    // ✅ এখানে updates এ displayName এবং phoneNumber উভয়ই থাকবে
    await updateProfile(values);
    setSubmitting(false);
  };

  return (
    <Card title="👤 Your Profile Details" variant="borderless">
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={initialValues} // আপডেট করা ইনিশিয়াল ভ্যালু
        style={{ maxWidth: 400 }}
      >
        <Form.Item label="Email (Read-Only)">
          <Input value={user.email} disabled />
        </Form.Item>
        <Form.Item
          name="displayName"
          label="Display Name"
          rules={[
            { required: true, message: "Please enter your display name" },
          ]}
        >
          <Input placeholder="Your Name" />
        </Form.Item>
        {/* ✅ Phone Number Field */}
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
          <Input placeholder="e.g., 017xxxxxxxx" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save Profile
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

// --- B. Mess Settings Form (শুধুমাত্র ম্যানেজার) ---
const MessSettingsForm: React.FC<{
  settings: MessSettings | null;
  updateMessSettings: (updates: Partial<MessSettings>) => Promise<boolean>;
}> = ({ settings, updateMessSettings }) => {
  const [submitting, setSubmitting] = useState(false);

  if (!settings) {
    return <Spin tip="Loading Mess settings..." />;
  }

  const onFinish = async (values: MessSettings) => {
    setSubmitting(true);
    await updateMessSettings(values);
    setSubmitting(false);
  };

  return (
    <Card title="🏠 Mess General Settings" bordered={false}>
      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={settings}
        style={{ maxWidth: 400 }}
      >
        {/* শুধুমাত্র Mess Name রাখা হলো */}
        <Form.Item
          name="messName"
          label="Mess Name"
          rules={[{ required: true, message: "Please enter a Mess Name" }]}
        >
          <Input />
        </Form.Item>

        {/* Monthly Rent এবং Initial Deposit সরানো হয়েছে */}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Save Mess Name
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

// --- C. Main Settings Page Component ---
export default function SettingsPage() {
  // ✅ userProfile এখন localUserProfile ব্যবহার করছে
  const {
    userProfile,
    messSettings,
    loading,
    isManager,
    updateMessSettings,
    updateProfile,
  } = useSettings();

  if (loading || !userProfile) {
    return <Spin tip="Loading Settings..." style={{ margin: "50px 0" }} />;
  }

  const items = [
    {
      key: "1",
      label: (
        <span>
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
        <span>
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
    <Card className="shadow-lg">
      <Title level={2} style={{ margin: 0 }}>
        <SettingOutlined /> **App Settings**
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
        Manage your personal profile and the mess configuration.
      </Text>

      <Tabs defaultActiveKey="1" items={items} />

      {!isManager && (
        <Row justify="center" style={{ marginTop: 20 }}>
          <Col>
            <Text type="danger" strong>
              (👑 Only Manager can see and edit Mess Settings Tab)
            </Text>
          </Col>
        </Row>
      )}
    </Card>
  );
}

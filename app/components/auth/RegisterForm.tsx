import React from "react";
import { Form, Input, Button, Typography } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  LoginOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

interface RegisterFormProps {
  onFinish: (values: RegisterValues) => void;
  loading: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onFinish, loading }) => {
  const inputStyle = { height: 40 };

  return (
    <Form
      name="register"
      onFinish={onFinish}
      layout="vertical"
      scrollToFirstError
    >
      <Title
        level={4}
        style={{ textAlign: "center", margin: "0 0 25px 0", color: "#004d40" }}
      >
        Create Account
      </Title>

      {/* Full Name */}
      <Form.Item
        name="name"
        label="Your Name"
        rules={[{ required: true, message: "Please input your name!" }]}
      >
        <Input
          prefix={<UserOutlined style={{ color: "#b0bec5" }} />}
          placeholder="Full Name"
          style={inputStyle}
        />
      </Form.Item>
      {/* Email */}
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { type: "email", message: "Invalid E-mail!" },
          { required: true, message: "Please input your E-mail!" },
        ]}
      >
        <Input
          prefix={<MailOutlined style={{ color: "#b0bec5" }} />}
          placeholder="Email Address"
          style={inputStyle}
        />
      </Form.Item>
      {/* Password */}
      <Form.Item
        name="password"
        label="Password"
        rules={[
          { required: true, message: "Please input your password!" },
          { min: 6, message: "Min 6 characters." },
        ]}
        hasFeedback
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: "#b0bec5" }} />}
          placeholder="Password"
          style={inputStyle}
        />
      </Form.Item>
      {/* Confirm Password */}
      <Form.Item
        name="confirm"
        label="Confirm Password"
        dependencies={["password"]}
        hasFeedback
        rules={[
          { required: true, message: "Please confirm your password!" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Passwords do not match!"));
            },
          }),
        ]}
        style={{ marginBottom: 15 }}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: "#b0bec5" }} />}
          placeholder="Confirm Password"
          style={inputStyle}
        />
      </Form.Item>
      {/* Button */}
      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          icon={<LoginOutlined />}
          style={{
            height: 45,
            fontSize: 16,
            backgroundColor: "#004d40",
            borderColor: "#004d40",
            fontWeight: "bold",
          }}
        >
          Sign Up
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegisterForm;

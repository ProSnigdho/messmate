import React from "react";
import { Form, Input, Button, Typography } from "antd";
import { MailOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface LoginValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onFinish: (values: LoginValues) => void;
  loading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onFinish, loading }) => (
  <Form
    name="login"
    onFinish={onFinish}
    layout="vertical"
    initialValues={{ remember: true }}
    style={{ paddingTop: 0 }}
  >
    <Title
      level={4}
      style={{ textAlign: "center", margin: "0 0 25px 0", color: "#004d40" }}
    >
      Sign In
    </Title>

    {/* Email Input */}
    <Form.Item
      name="email"
      label="Email"
      rules={[
        { type: "email", message: "Invalid E-mail!" },
        { required: true, message: "Please input your Email!" },
      ]}
    >
      <Input
        prefix={<MailOutlined style={{ color: "#b0bec5" }} />}
        placeholder="Email Address"
        type="email"
        style={{ height: 40 }}
      />
    </Form.Item>

    {/* Password Input */}
    <Form.Item
      name="password"
      label="Password"
      rules={[
        { required: true, message: "Please input your Password!" },
        { min: 6, message: "Min 6 characters." },
      ]}
      style={{ marginBottom: 30 }}
    >
      <Input.Password
        prefix={<LockOutlined style={{ color: "#b0bec5" }} />}
        placeholder="Password"
        style={{ height: 40 }}
      />
    </Form.Item>

    {/* Submit Button */}
    <Form.Item>
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
        Log in
      </Button>
    </Form.Item>

    <Text
      type="secondary"
      style={{ textAlign: "center", marginTop: 15, display: "block" }}
    >
      <a href="#" style={{ color: "#004d40", fontWeight: "bold" }}>
        Forgot Password?
      </a>
    </Text>
  </Form>
);

export default LoginForm;

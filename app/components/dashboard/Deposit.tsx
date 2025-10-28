"use client";

import React, { useState, useMemo } from "react";
import { useDeposits } from "../../lib/hooks/useDeposits";
import { useAuth } from "../../lib/auth-context";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Form,
  InputNumber,
  Input,
  Typography,
  Spin,
  Alert,
  Tag,
  Select,
  Statistic,
  Progress,
  Space,
  Divider,
  DatePicker,
  Tabs,
  message,
  Grid,
  Badge,
} from "antd";
import {
  BankOutlined,
  DollarCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  HomeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  WifiOutlined,
  BulbOutlined,
  DropboxOutlined,
  UserOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TransactionOutlined,
  TeamOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import moment from "moment";
import type {
  Deposit as DepositType,
  UserProfile,
  DepositCategory,
} from "../../lib/types";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;
const { MonthPicker } = DatePicker;
const { useBreakpoint } = Grid;

const THEME_COLOR = "#004d40ff";
const THEME_COLOR_LIGHT = "#e0f2f1";
const THEME_COLOR_DARK = "#00796b";

const DEPOSIT_CATEGORIES = [
  {
    value: "rent",
    label: "Home Rent",
    color: "volcano",
    icon: <HomeOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #00796b)`,
  },
  {
    value: "gas_contribution",
    label: "Gas Bill Share",
    color: "orange",
    icon: <FireOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #ff9800)`,
  },
  {
    value: "internet_contribution",
    label: "Internet Bill Share",
    color: "blue",
    icon: <WifiOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #2196f3)`,
  },
  {
    value: "electricity_contribution",
    label: "Electricity Bill Share",
    color: "volcano",
    icon: <BulbOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #ffeb3b)`,
  },
  {
    value: "water_contribution",
    label: "Water Bill Share",
    color: "cyan",
    icon: <DropboxOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #00bcd4)`,
  },
  {
    value: "cleaner_contribution",
    label: "Cleaner Salary Share",
    color: "green",
    icon: <UserOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #4caf50)`,
  },
  {
    value: "other_bills_contribution",
    label: "Other Bills Share",
    color: "gray",
    icon: <SettingOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #9e9e9e)`,
  },
  {
    value: "utility_contribution",
    label: "Utility Bill Share",
    color: "purple",
    icon: <HomeOutlined />,
    gradient: `linear-gradient(135deg, ${THEME_COLOR}, #9c27b0)`,
  },
];

const ModernCard: React.FC<{
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  gradient?: string;
  className?: string;
}> = ({
  title,
  children,
  icon,
  gradient = `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
  className = "",
}) => (
  <Card
    className={`modern-card ${className}`}
    title={
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <Text strong style={{ color: "#fff", fontSize: "16px" }}>
          {title}
        </Text>
      </div>
    }
    style={{
      background: gradient,
      border: "none",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(0, 77, 64, 0.15)",
      overflow: "hidden",
    }}
    styles={{
      header: {
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        padding: "16px 20px",
        background: "rgba(255, 255, 255, 0.1)",
      },
      body: {
        padding: "20px",
        background: "#fff",
        minHeight: "200px",
      },
    }}
  >
    {children}
  </Card>
);

const StatCard: React.FC<{
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
}> = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  trend,
  icon,
  color = THEME_COLOR,
}) => (
  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      border: `1px solid ${THEME_COLOR_LIGHT}`,
      boxShadow: "0 2px 8px rgba(0, 77, 64, 0.08)",
      transition: "all 0.3s ease",
    }}
    className="hover:shadow-lg"
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "8px",
      }}
    >
      <Text type="secondary" style={{ fontSize: "14px", fontWeight: 500 }}>
        {title}
      </Text>
      {icon && (
        <div
          style={{
            background: `${THEME_COLOR_LIGHT}`,
            padding: "6px",
            borderRadius: "8px",
            color: THEME_COLOR,
            fontSize: "16px",
          }}
        >
          {icon}
        </div>
      )}
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
      <Text
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: THEME_COLOR,
          lineHeight: 1,
        }}
      >
        {prefix}
        {typeof value === "number" ? value.toFixed(precision || 0) : value}
      </Text>
      {suffix && (
        <Text style={{ fontSize: "16px", color: "#6b7280", fontWeight: 500 }}>
          {suffix}
        </Text>
      )}
    </div>
    {trend !== undefined && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "8px",
        }}
      >
        {trend >= 0 ? (
          <ArrowUpOutlined style={{ color: "#10b981", fontSize: "12px" }} />
        ) : (
          <ArrowDownOutlined style={{ color: "#ef4444", fontSize: "12px" }} />
        )}
        <Text
          style={{
            color: trend >= 0 ? "#10b981" : "#ef4444",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {Math.abs(trend)}%
        </Text>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          vs last month
        </Text>
      </div>
    )}
  </div>
);

const RentPaymentForm: React.FC<{
  members: UserProfile[];
  addTransaction: (
    category: DepositCategory,
    amount: number,
    involvedUid: string,
    description: string,
    rentMonth?: string
  ) => Promise<boolean>;
  getMemberRentStatus: (member: UserProfile) => any;
}> = ({ members, addTransaction, getMemberRentStatus }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [rentMonth, setRentMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const screens = useBreakpoint();

  const onFinish = async (values: { amount: number; description: string }) => {
    if (!selectedMember) {
      message.error("Please select a member");
      return;
    }

    setSubmitting(true);

    const currentRentMonth = rentMonth || new Date().toISOString().slice(0, 7);

    await addTransaction(
      "rent",
      values.amount,
      selectedMember,
      values.description,
      currentRentMonth
    );
    setSubmitting(false);

    form.resetFields();
  };

  const selectedMemberData = members.find((m) => m.uid === selectedMember);
  const rentStatus = selectedMemberData
    ? getMemberRentStatus(selectedMemberData)
    : null;

  return (
    <ModernCard
      title="Record Rent Payment"
      icon={<HomeOutlined />}
      gradient={`linear-gradient(135deg, ${THEME_COLOR}, #1b5e20)`}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="involvedUid"
          label="Select Member"
          rules={[{ required: true, message: "Please select a member" }]}
        >
          <Select
            placeholder="Select member for rent payment"
            onChange={setSelectedMember}
            size="large"
            style={{ borderRadius: "8px" }}
          >
            {members.map((member) => (
              <Option key={member.uid} value={member.uid}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text>{member.displayName}</Text>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Rent: ৳
                    {(member.monthlyRent || 0) + (member.customRent || 0)}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedMemberData && rentStatus && (
          <div
            style={{
              marginBottom: 16,
              padding: 16,
              background: THEME_COLOR_LIGHT,
              borderRadius: "12px",
              border: `1px solid ${THEME_COLOR}33`,
            }}
          >
            <Text
              strong
              style={{
                display: "block",
                marginBottom: 12,
                fontSize: "14px",
                color: THEME_COLOR,
              }}
            >
              🏠 Rent Status for {selectedMemberData.displayName}
            </Text>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: "center" }}>
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", display: "block" }}
                  >
                    Total Rent
                  </Text>
                  <Text strong style={{ fontSize: "16px", color: THEME_COLOR }}>
                    ৳{rentStatus.totalRent}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center" }}>
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", display: "block" }}
                  >
                    Paid
                  </Text>
                  <Text strong style={{ fontSize: "16px", color: "#10b981" }}>
                    ৳{rentStatus.paid}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center" }}>
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", display: "block" }}
                  >
                    Remaining
                  </Text>
                  <Text
                    strong
                    style={{
                      fontSize: "16px",
                      color: rentStatus.remaining > 0 ? "#ef4444" : "#10b981",
                    }}
                  >
                    ৳{rentStatus.remaining}
                  </Text>
                </div>
              </Col>
            </Row>
            <Progress
              percent={Math.round(
                (rentStatus.paid / rentStatus.totalRent) * 100
              )}
              size="small"
              status={rentStatus.isFullyPaid ? "success" : "active"}
              style={{ marginTop: 12 }}
              strokeColor={{
                "0%": "#ff6b6b",
                "50%": THEME_COLOR,
                "100%": "#66bb6a",
              }}
            />
          </div>
        )}

        <Form.Item
          name="rentMonth"
          label="Rent Month"
          initialValue={moment()}
          rules={[{ required: true, message: "Please select rent month" }]}
        >
          <MonthPicker
            format="MMMM YYYY"
            onChange={(date) => {
              setRentMonth(
                date
                  ? date.format("YYYY-MM")
                  : new Date().toISOString().slice(0, 7)
              );
            }}
            style={{ width: "100%" }}
            size="large"
            suffixIcon={<CalendarOutlined style={{ color: THEME_COLOR }} />}
          />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Amount (৳)"
              rules={[{ required: true, message: "Enter the amount" }]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%", borderRadius: "8px" }}
                placeholder="Rent amount"
                size="large"
                prefix="৳"
                controls={false}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label="Details">
              <Input
                placeholder="e.g., November Rent, Advance Rent"
                size="large"
                style={{ borderRadius: "8px" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<HomeOutlined />}
            block
            size="large"
            style={{
              height: "48px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
              border: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Record Rent Payment
          </Button>
        </Form.Item>
      </Form>
    </ModernCard>
  );
};

const BillPaymentForm: React.FC<{
  members: UserProfile[];
  addTransaction: (
    category: DepositCategory,
    amount: number,
    involvedUid: string,
    description: string
  ) => Promise<boolean>;
  getTotalDueAmount: (category: DepositCategory) => number;
  getTotalPaidAmount: (category: DepositCategory) => number;
  getMemberDueAmount: (category: DepositCategory, memberId?: string) => number;
  getMemberPaidAmount: (memberId: string, category: DepositCategory) => number;
}> = ({
  members,
  addTransaction,
  getTotalDueAmount,
  getTotalPaidAmount,
  getMemberDueAmount,
  getMemberPaidAmount,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] =
    useState<DepositCategory>("gas_contribution");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const screens = useBreakpoint();

  const onFinish = async (values: { amount: number; description: string }) => {
    if (!selectedMember) {
      message.error("Please select a member");
      return;
    }

    setSubmitting(true);
    await addTransaction(
      selectedCategory,
      values.amount,
      selectedMember,
      values.description
    );
    setSubmitting(false);

    form.resetFields();
  };

  const totalDue = getTotalDueAmount(selectedCategory);
  const totalPaid = getTotalPaidAmount(selectedCategory);
  const totalRemaining = totalDue - totalPaid;
  const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  const memberDue = selectedMember
    ? getMemberDueAmount(selectedCategory, selectedMember)
    : 0;
  const memberPaid = selectedMember
    ? getMemberPaidAmount(selectedMember, selectedCategory)
    : 0;
  const memberRemaining = memberDue - memberPaid;

  const selectedCategoryInfo = DEPOSIT_CATEGORIES.find(
    (cat) => cat.value === selectedCategory
  );

  return (
    <ModernCard
      title="Record Bill Payment"
      icon={<CreditCardOutlined />}
      gradient={`linear-gradient(135deg, ${THEME_COLOR}, #00796b)`}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          amount: memberRemaining > 0 ? memberRemaining : undefined,
        }}
      >
        <Form.Item
          name="category"
          label="Bill Type"
          rules={[{ required: true, message: "Please select a bill type" }]}
        >
          <Select
            placeholder="Select bill type"
            onChange={(value: DepositCategory) => setSelectedCategory(value)}
            size="large"
            style={{ borderRadius: "8px" }}
          >
            {DEPOSIT_CATEGORIES.filter((cat) => cat.value !== "rent").map(
              (category) => (
                <Option key={category.value} value={category.value}>
                  <Space>
                    {category.icon}
                    {category.label}
                  </Space>
                </Option>
              )
            )}
          </Select>
        </Form.Item>

        {totalDue > 0 && (
          <div
            style={{
              padding: "16px",
              background: THEME_COLOR_LIGHT,
              borderRadius: "12px",
              marginBottom: "16px",
              border: `1px solid ${THEME_COLOR}33`,
            }}
          >
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text strong style={{ fontSize: "14px", color: THEME_COLOR }}>
                📊 Total Bill Information
              </Text>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: "11px", display: "block" }}
                    >
                      Total Bill
                    </Text>
                    <Text
                      strong
                      style={{ fontSize: "14px", color: THEME_COLOR }}
                    >
                      ৳{totalDue.toFixed(0)}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: "11px", display: "block" }}
                    >
                      Collected
                    </Text>
                    <Text strong style={{ fontSize: "14px", color: "#10b981" }}>
                      ৳{totalPaid.toFixed(0)}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: "11px", display: "block" }}
                    >
                      Remaining
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: "14px",
                        color: totalRemaining > 0 ? "#ef4444" : "#10b981",
                      }}
                    >
                      ৳{totalRemaining.toFixed(0)}
                    </Text>
                  </div>
                </Col>
              </Row>
              <Progress
                percent={Math.round(collectionRate)}
                size="small"
                status={
                  collectionRate > 80
                    ? "success"
                    : collectionRate > 50
                    ? "active"
                    : "exception"
                }
                strokeColor={{
                  "0%": "#ef4444",
                  "50%": THEME_COLOR,
                  "100%": "#10b981",
                }}
                style={{ marginTop: 8 }}
              />
              <Text
                type="secondary"
                style={{
                  fontSize: "11px",
                  textAlign: "center",
                  display: "block",
                }}
              >
                Collection Rate: {collectionRate.toFixed(1)}%
              </Text>
            </Space>
          </div>
        )}

        <Form.Item
          name="involvedUid"
          label="Paying Member"
          rules={[
            {
              required: true,
              message: "Please select the paying member",
            },
          ]}
        >
          <Select
            placeholder="Select paying member"
            onChange={setSelectedMember}
            value={selectedMember}
            size="large"
            style={{ borderRadius: "8px" }}
          >
            {members.map((member) => (
              <Option key={member.uid} value={member.uid}>
                {member.displayName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedMember && memberDue > 0 && (
          <div
            style={{
              padding: "16px",
              background: "#fff3e0",
              borderRadius: "12px",
              marginBottom: "16px",
              border: "1px solid #ffb74d",
            }}
          >
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text strong style={{ fontSize: "14px" }}>
                👤 Individual Share
              </Text>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: "11px", display: "block" }}
                    >
                      Share
                    </Text>
                    <Text strong style={{ fontSize: "14px" }}>
                      ৳{memberDue.toFixed(0)}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: "11px", display: "block" }}
                    >
                      Paid
                    </Text>
                    <Text strong style={{ fontSize: "14px" }}>
                      ৳{memberPaid.toFixed(0)}
                    </Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: "11px", display: "block" }}
                    >
                      Remaining
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: "14px",
                        color: memberRemaining > 0 ? "#ef4444" : "#10b981",
                      }}
                    >
                      ৳{memberRemaining.toFixed(0)}
                    </Text>
                  </div>
                </Col>
              </Row>
              {memberRemaining > 0 && (
                <Text
                  type="secondary"
                  style={{
                    fontSize: "11px",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  💡 Suggested amount: ৳{memberRemaining.toFixed(0)}
                </Text>
              )}
            </Space>
          </div>
        )}

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Amount (৳)"
              rules={[{ required: true, message: "Enter the amount" }]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%", borderRadius: "8px" }}
                placeholder="Payment amount"
                size="large"
                prefix="৳"
                controls={false}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label="Details">
              <Input
                placeholder="e.g., November Gas Bill, Partial Payment"
                size="large"
                style={{ borderRadius: "8px" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<CreditCardOutlined />}
            block
            size="large"
            style={{
              height: "48px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
              border: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Record Bill Payment
          </Button>
        </Form.Item>
      </Form>
    </ModernCard>
  );
};

const RentStatusTable: React.FC<{
  members: UserProfile[];
  getMemberRentStatus: (member: UserProfile) => any;
}> = ({ members, getMemberRentStatus }) => {
  const screens = useBreakpoint();

  const rentData = members.map((member) => {
    const status = getMemberRentStatus(member);
    return {
      key: member.uid,
      name: member.displayName,
      totalRent: status.totalRent,
      paid: status.paid,
      remaining: status.remaining,
      progress: (status.paid / status.totalRent) * 100,
      isFullyPaid: status.isFullyPaid,
      payments: status.payments.length,
    };
  });

  return (
    <ModernCard
      title="Monthly Rent Collection Status"
      icon={<HomeOutlined />}
      gradient={`linear-gradient(135deg, ${THEME_COLOR}, #1b5e20)`}
    >
      <Table
        dataSource={rentData}
        pagination={false}
        scroll={{ x: screens.xs ? 400 : 600 }}
        size={screens.xs ? "small" : "middle"}
        style={{
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Column
          title="Member"
          dataIndex="name"
          key="name"
          width={screens.xs ? 100 : 120}
          render={(name) => <Text strong>{name}</Text>}
        />
        <Column
          title="Total Rent"
          dataIndex="totalRent"
          key="totalRent"
          align="right"
          width={screens.xs ? 80 : 100}
          render={(amount) => (
            <Text strong style={{ color: THEME_COLOR }}>
              ৳{amount}
            </Text>
          )}
        />
        <Column
          title="Paid"
          dataIndex="paid"
          key="paid"
          align="right"
          width={screens.xs ? 80 : 100}
          render={(amount) => (
            <Text style={{ color: "#10b981" }}>৳{amount}</Text>
          )}
        />
        <Column
          title="Remaining"
          dataIndex="remaining"
          key="remaining"
          align="right"
          width={screens.xs ? 80 : 100}
          render={(amount, record: any) => (
            <Text strong style={{ color: amount > 0 ? "#ef4444" : "#10b981" }}>
              ৳{amount}
            </Text>
          )}
        />
        <Column
          title="Progress"
          dataIndex="progress"
          key="progress"
          width={screens.xs ? 120 : 150}
          render={(percent, record: any) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Progress
                percent={Math.round(percent)}
                size="small"
                status={record.isFullyPaid ? "success" : "active"}
                strokeColor={{
                  "0%": "#ff6b6b",
                  "50%": THEME_COLOR,
                  "100%": "#66bb6a",
                }}
                style={{ margin: 0, flex: 1 }}
              />
              <Text type="secondary" style={{ fontSize: "12px", minWidth: 35 }}>
                {Math.round(percent)}%
              </Text>
            </div>
          )}
        />
        <Column
          title="Status"
          dataIndex="isFullyPaid"
          key="isFullyPaid"
          width={screens.xs ? 80 : 100}
          align="center"
          render={(isFullyPaid) => (
            <Badge
              status={isFullyPaid ? "success" : "warning"}
              text={
                <Text
                  style={{
                    color: isFullyPaid ? "#10b981" : "#f59e0b",
                    fontSize: screens.xs ? "11px" : "12px",
                  }}
                >
                  {isFullyPaid ? "Paid" : "Pending"}
                </Text>
              }
            />
          )}
        />
      </Table>
    </ModernCard>
  );
};

const BillDueStatusTable: React.FC<{
  members: UserProfile[];
  getMemberDueAmount: (category: DepositCategory, memberId?: string) => number;
  getMemberPaidAmount: (memberId: string, category: DepositCategory) => number;
}> = ({ members, getMemberDueAmount, getMemberPaidAmount }) => {
  const screens = useBreakpoint();

  const billCategories = DEPOSIT_CATEGORIES.filter(
    (cat) => cat.value !== "rent"
  );

  const billData = members.map((member) => {
    const memberBills: any = { key: member.uid, name: member.displayName };

    billCategories.forEach((category) => {
      const dueAmount = getMemberDueAmount(
        category.value as DepositCategory,
        member.uid
      );
      const paidAmount = getMemberPaidAmount(
        member.uid,
        category.value as DepositCategory
      );
      const remaining = dueAmount - paidAmount;

      memberBills[category.value] = {
        due: dueAmount,
        paid: paidAmount,
        remaining: remaining,
        isPaid: remaining <= 0,
      };
    });

    return memberBills;
  });

  return (
    <ModernCard
      title="Bill Payment Status"
      icon={<FileTextOutlined />}
      gradient={`linear-gradient(135deg, ${THEME_COLOR}, #00796b)`}
    >
      <Table
        dataSource={billData}
        pagination={false}
        scroll={{ x: screens.xs ? 800 : 1000 }}
        size={screens.xs ? "small" : "middle"}
        style={{
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <Column
          title="Member"
          dataIndex="name"
          key="name"
          width={screens.xs ? 100 : 120}
          fixed="left"
          render={(name) => (
            <Text
              strong
              style={{
                fontSize: screens.xs ? "13px" : "14px",
                color: THEME_COLOR,
              }}
            >
              {name}
            </Text>
          )}
        />

        {billCategories.map((category) => (
          <Column
            key={category.value}
            title={
              <div
                style={{
                  textAlign: "center",
                  minWidth: screens.xs ? 70 : 80,
                }}
              >
                <div
                  style={{
                    fontSize: screens.xs ? "14px" : "16px",
                    marginBottom: 4,
                    color: "white",
                  }}
                >
                  {category.icon}
                </div>
                <Text
                  strong
                  style={{
                    fontSize: screens.xs ? "11px" : "12px",
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  {category.label.split(" ")[0]}
                </Text>
              </div>
            }
            width={screens.xs ? 90 : 110}
            align="center"
            render={(_, record: any) => {
              const bill = record[category.value];
              if (!bill || bill.due === 0) {
                return (
                  <div style={{ padding: screens.xs ? "6px 2px" : "8px 4px" }}>
                    <div
                      style={{
                        background: bill.isPaid ? "#d4edda" : "#fff3cd", // ✅ Original background
                        padding: screens.xs ? "8px" : "10px",
                        borderRadius: "8px",
                        border: `2px solid ${
                          bill.isPaid ? "#28a745" : "#ffc107"
                        }`,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: screens.xs ? "11px" : "12px",
                          color: "#495057",
                          fontWeight: 500,
                        }}
                      >
                        No Due
                      </Text>
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ padding: screens.xs ? "6px 2px" : "8px 4px" }}>
                  <div
                    style={{
                      background: bill.isPaid ? "#d4edda" : "#fff3cd", // ✅ Original background
                      padding: screens.xs ? "8px" : "12px",
                      borderRadius: "8px",
                      border: `2px solid ${
                        bill.isPaid ? "#28a745" : "#ffc107"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: screens.xs ? 4 : 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: screens.xs ? "10px" : "11px",
                            color: "#495057",
                            fontWeight: 500,
                          }}
                        >
                          Due:
                        </Text>
                        <Text
                          strong
                          style={{
                            fontSize: screens.xs ? "10px" : "11px",
                            color: THEME_COLOR,
                          }}
                        >
                          ৳{bill.due.toFixed(0)}
                        </Text>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: screens.xs ? "10px" : "11px",
                            color: "#495057",
                            fontWeight: 500,
                          }}
                        >
                          Paid:
                        </Text>
                        <Text
                          strong
                          style={{
                            fontSize: screens.xs ? "10px" : "11px",
                            color: "#28a745",
                          }}
                        >
                          ৳{bill.paid.toFixed(0)}
                        </Text>
                      </div>

                      <div
                        style={{
                          background: bill.isPaid ? "#28a745" : THEME_COLOR,
                          color: "white",
                          borderRadius: "6px",
                          padding: screens.xs ? "3px 6px" : "4px 8px",
                          textAlign: "center",
                          marginTop: screens.xs ? 2 : 4,
                        }}
                      >
                        <Text
                          strong
                          style={{
                            fontSize: screens.xs ? "10px" : "11px",
                            lineHeight: 1.2,
                          }}
                        >
                          {bill.isPaid
                            ? "Fully Paid"
                            : `Due: ৳${bill.remaining.toFixed(0)}`}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        ))}
      </Table>
    </ModernCard>
  );
};

interface DepositProps {
  messId: string;
}

export default function Deposit({ messId }: DepositProps) {
  const {
    deposits,
    members,
    loading: depositsLoading,
    addTransaction,
    isManager,
    getTotalDueAmount,
    getTotalPaidAmount,
    getMemberDueAmount,
    getMemberPaidAmount,
    getMemberRentStatus,
    getRentSummary,
  } = useDeposits();
  const { user, loading: authLoading } = useAuth();
  const screens = useBreakpoint();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    isManager ? "all" : user?.uid || "all"
  );
  const [activeTab, setActiveTab] = useState("contributions");

  const filteredDeposits = useMemo(() => {
    if (!isManager) {
      return deposits.filter((dep) => dep.userId === user?.uid);
    } else {
      if (selectedMemberId === "all") {
        return deposits;
      }
      return deposits.filter((dep) => dep.userId === selectedMemberId);
    }
  }, [deposits, selectedMemberId, isManager, user?.uid]);

  const { totalContribution, userTotalContribution, rentSummary } =
    useMemo(() => {
      let contributionSum = 0;
      let userContributionSum = 0;

      filteredDeposits.forEach((dep) => {
        contributionSum += dep.amount;
        if (dep.userId === user?.uid) {
          userContributionSum += dep.amount;
        }
      });

      return {
        totalContribution: contributionSum,
        userTotalContribution: userContributionSum,
        rentSummary: getRentSummary(),
      };
    }, [filteredDeposits, user?.uid, getRentSummary]);

  const tabItems = [
    {
      key: "contributions",
      label: (
        <Space style={{ whiteSpace: "nowrap", padding: "8px 16px" }}>
          <DashboardOutlined />
          <Text
            strong
            style={{
              fontSize: screens.xs ? "14px" : "18px", // ✅ Increased font size
              color: activeTab === "contributions" ? "white" : THEME_COLOR, // ✅ White when active
            }}
          >
            Dashboard
          </Text>
        </Space>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                {isManager ? (
                  <RentPaymentForm
                    members={members}
                    addTransaction={addTransaction}
                    getMemberRentStatus={getMemberRentStatus}
                  />
                ) : (
                  <Alert
                    message="View Only Access"
                    description="Only managers can record payments. Please contact your mess manager for any payment related queries."
                    type="info"
                    showIcon
                    style={{
                      marginBottom: 20,
                      borderRadius: "12px",
                    }}
                  />
                )}
              </Col>
              <Col span={24}>
                {isManager ? (
                  <BillPaymentForm
                    members={members}
                    addTransaction={addTransaction}
                    getTotalDueAmount={getTotalDueAmount}
                    getTotalPaidAmount={getTotalPaidAmount}
                    getMemberDueAmount={getMemberDueAmount}
                    getMemberPaidAmount={getMemberPaidAmount}
                  />
                ) : (
                  <ModernCard
                    title="Payment Summary"
                    icon={<CreditCardOutlined />}
                    gradient={`linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Statistic
                        title="Your Total Contributions"
                        value={userTotalContribution}
                        prefix="৳"
                        precision={2}
                        valueStyle={{ color: THEME_COLOR }}
                      />
                      <Text
                        type="secondary"
                        style={{ textAlign: "center", display: "block" }}
                      >
                        Contact manager for payment queries
                      </Text>
                    </Space>
                  </ModernCard>
                )}
              </Col>
            </Row>
          </Col>

          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: screens.xs
                      ? "1fr"
                      : "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                  }}
                >
                  <StatCard
                    title={
                      isManager ? "Total Contributions" : "Your Contributions"
                    }
                    value={
                      isManager ? totalContribution : userTotalContribution
                    }
                    prefix="৳"
                    precision={0}
                    icon={<TransactionOutlined />}
                    color={THEME_COLOR}
                  />
                  {isManager && (
                    <>
                      <StatCard
                        title="Monthly Rent Target"
                        value={rentSummary.totalRent}
                        prefix="৳"
                        precision={0}
                        icon={<HomeOutlined />}
                        color={THEME_COLOR}
                      />
                      <StatCard
                        title="Rent Collected"
                        value={rentSummary.totalPaid}
                        prefix="৳"
                        precision={0}
                        icon={<CheckCircleOutlined />}
                        color={THEME_COLOR}
                      />
                      <StatCard
                        title="Collection Rate"
                        value={rentSummary.collectionRate}
                        suffix="%"
                        precision={1}
                        icon={<TeamOutlined />}
                        color={THEME_COLOR}
                      />
                    </>
                  )}
                </div>
              </Col>

              <Col span={24}>
                <ModernCard
                  title={
                    isManager
                      ? "All Contributions & Payments"
                      : "Your Payment History"
                  }
                  icon={<HistoryOutlined />}
                  gradient={`linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`}
                >
                  {isManager && (
                    <div
                      style={{
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        background: THEME_COLOR_LIGHT,
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: `1px solid ${THEME_COLOR}33`,
                        flexDirection: screens.xs ? "column" : "row",
                        gap: screens.xs ? "12px" : "0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          minWidth: screens.xs ? "100%" : "auto",
                        }}
                      >
                        <FilterOutlined
                          style={{ color: THEME_COLOR, marginRight: 8 }}
                        />
                        <Text
                          strong
                          style={{
                            marginRight: 12,
                            minWidth: screens.xs ? "auto" : 100,
                          }}
                        >
                          Filter by Member:
                        </Text>
                      </div>
                      <Select
                        placeholder="View All Members"
                        style={{ width: screens.xs ? "100%" : 250 }}
                        value={selectedMemberId}
                        onChange={setSelectedMemberId}
                        size="middle"
                      >
                        <Option value="all" key="all">
                          <TeamOutlined /> View All Members
                        </Option>
                        {members.map((member) => (
                          <Option key={member.uid} value={member.uid}>
                            {member.displayName}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {!isManager && (
                    <Alert
                      message="Personal Payment History"
                      description="This table shows only your personal payment records. You cannot add or edit payments."
                      type="info"
                      showIcon
                      style={{
                        marginBottom: 16,
                        borderRadius: "8px",
                      }}
                    />
                  )}

                  <Table
                    dataSource={filteredDeposits}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                    }}
                    scroll={{ x: screens.xs ? 600 : 800 }}
                    size={screens.xs ? "small" : "middle"}
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                    locale={{
                      emptyText: (
                        <div style={{ padding: "40px 0", textAlign: "center" }}>
                          <TransactionOutlined
                            style={{
                              fontSize: "48px",
                              color: "#d1d5db",
                              marginBottom: 16,
                            }}
                          />
                          <Text type="secondary" style={{ display: "block" }}>
                            {isManager
                              ? "No payments recorded yet."
                              : "You haven't made any payments yet."}
                          </Text>
                        </div>
                      ),
                    }}
                  >
                    <Column
                      title="Date & Time"
                      dataIndex="date"
                      key="date"
                      width={screens.xs ? 120 : 160}
                      render={(date: any) =>
                        date && date.toDate
                          ? moment(date.toDate()).format(
                              screens.xs ? "MMM DD" : "MMM DD, YYYY h:mm a"
                            )
                          : "N/A"
                      }
                      sorter={(a, b) => a.date.toDate() - b.date.toDate()}
                    />
                    <Column
                      title="Payment Type"
                      dataIndex="category"
                      key="category"
                      width={screens.xs ? 120 : 160}
                      render={(category: DepositCategory) => {
                        const categoryInfo = DEPOSIT_CATEGORIES.find(
                          (c) => c.value === category
                        );
                        return (
                          <div
                            style={{
                              background: categoryInfo?.gradient || THEME_COLOR,
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: screens.xs ? "10px" : "11px",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              justifyContent: "center",
                            }}
                          >
                            {categoryInfo?.icon}
                            {screens.xs
                              ? categoryInfo?.label.split(" ")[0]
                              : categoryInfo?.label}
                          </div>
                        );
                      }}
                      filters={DEPOSIT_CATEGORIES.map((cat) => ({
                        text: cat.label,
                        value: cat.value,
                      }))}
                      onFilter={(value, record) => record.category === value}
                    />
                    <Column
                      title="Amount"
                      dataIndex="amount"
                      key="amount"
                      width={screens.xs ? 80 : 120}
                      align="right"
                      render={(amount: number) => (
                        <Text
                          strong
                          style={{
                            color: THEME_COLOR,
                            fontSize: screens.xs ? "12px" : "14px",
                          }}
                        >
                          ৳{amount ? amount.toFixed(2) : "0.00"}
                        </Text>
                      )}
                      sorter={(a, b) => a.amount - b.amount}
                    />
                    <Column
                      title="Member"
                      dataIndex="userName"
                      key="userName"
                      width={screens.xs ? 100 : 140}
                      render={(name: string, record: any) => (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 8px",
                            background:
                              record.userId === user?.uid
                                ? `${THEME_COLOR}15`
                                : "transparent",
                            borderRadius: "6px",
                            border:
                              record.userId === user?.uid
                                ? `1px solid ${THEME_COLOR}30`
                                : "none",
                          }}
                        >
                          <UserOutlined
                            style={{
                              color:
                                record.userId === user?.uid
                                  ? THEME_COLOR
                                  : "#6b7280",
                              fontSize: "12px",
                            }}
                          />
                          <Text
                            style={{
                              fontSize: screens.xs ? "11px" : "12px",
                              color:
                                record.userId === user?.uid
                                  ? THEME_COLOR
                                  : "#1f2937",
                              fontWeight:
                                record.userId === user?.uid ? 600 : 400,
                            }}
                          >
                            {screens.xs ? name.split(" ")[0] : name}{" "}
                            {record.userId === user?.uid && "(You)"}
                          </Text>
                        </div>
                      )}
                    />
                    <Column
                      title="Payment Details"
                      dataIndex="description"
                      key="description"
                      ellipsis
                      width={screens.xs ? 120 : 200}
                    />
                    {isManager && (
                      <Column
                        title="Rent Month"
                        dataIndex="rentMonth"
                        key="rentMonth"
                        width={screens.xs ? 80 : 120}
                        render={(month: string) =>
                          month && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#fff3e0",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #ffb74d30",
                              }}
                            >
                              <CalendarOutlined
                                style={{ color: "#f59e0b", fontSize: "12px" }}
                              />
                              <Text
                                style={{
                                  fontSize: screens.xs ? "10px" : "11px",
                                  color: "#f59e0b",
                                  fontWeight: 500,
                                }}
                              >
                                {moment(month).format(
                                  screens.xs ? "MMM YY" : "MMM YYYY"
                                )}
                              </Text>
                            </div>
                          )
                        }
                      />
                    )}
                  </Table>
                </ModernCard>
              </Col>
            </Row>
          </Col>
        </Row>
      ),
    },
  ];

  if (isManager) {
    tabItems.push({
      key: "status",
      label: (
        <Space style={{ whiteSpace: "nowrap", padding: "8px 16px" }}>
          <TeamOutlined />
          <Text
            strong
            style={{
              fontSize: screens.xs ? "14px" : "18px",
              color: activeTab === "status" ? "white" : THEME_COLOR,
            }}
          >
            Payment Status
          </Text>
        </Space>
      ),
      children: (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <RentStatusTable
                members={members}
                getMemberRentStatus={getMemberRentStatus}
              />
            </Col>
            <Col xs={24} lg={12}>
              <ModernCard
                title="Rent Collection Overview"
                icon={<DashboardOutlined />}
                gradient={`linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`}
              >
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="large"
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: screens.xs
                        ? "1fr"
                        : "repeat(2, 1fr)",
                      gap: 16,
                    }}
                  >
                    <StatCard
                      title="Total Monthly Rent"
                      value={rentSummary.totalRent}
                      prefix="৳"
                      precision={0}
                      icon={<HomeOutlined />}
                      color={THEME_COLOR}
                    />
                    <StatCard
                      title="Collected Amount"
                      value={rentSummary.totalPaid}
                      prefix="৳"
                      precision={0}
                      icon={<CheckCircleOutlined />}
                      color={THEME_COLOR}
                    />
                    <StatCard
                      title="Remaining Amount"
                      value={rentSummary.totalRemaining}
                      prefix="৳"
                      precision={0}
                      icon={<ExclamationCircleOutlined />}
                      color={THEME_COLOR}
                    />
                    <StatCard
                      title="Collection Rate"
                      value={rentSummary.collectionRate}
                      suffix="%"
                      precision={1}
                      icon={<TeamOutlined />}
                      color={THEME_COLOR}
                    />
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <Progress
                      percent={Math.round(rentSummary.collectionRate)}
                      status={
                        rentSummary.collectionRate > 80
                          ? "success"
                          : rentSummary.collectionRate > 50
                          ? "active"
                          : "exception"
                      }
                      strokeColor={{
                        "0%": "#ff6b6b",
                        "50%": THEME_COLOR,
                        "100%": "#66bb6a",
                      }}
                      style={{
                        borderRadius: "8px",
                        height: "12px",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 8,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Collection Progress
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: "12px", color: THEME_COLOR }}
                      >
                        {rentSummary.collectionRate.toFixed(1)}%
                      </Text>
                    </div>
                  </div>
                </Space>
              </ModernCard>
            </Col>
          </Row>

          <Divider />

          <BillDueStatusTable
            members={members}
            getMemberDueAmount={getMemberDueAmount}
            getMemberPaidAmount={getMemberPaidAmount}
          />
        </>
      ),
    });
  }

  if (authLoading || depositsLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
          borderRadius: "16px",
        }}
      >
        <Spin
          size="large"
          tip="Loading transaction history..."
          style={{
            color: "#fff",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f8fdfc 0%, #e0f2f1 100%)",
        minHeight: "100vh",
        padding: screens.xs ? "16px" : "24px",
      }}
    >
      <Card
        className="shadow-2xl"
        style={{
          background: "#fff",
          borderRadius: "20px",
          border: "none",
          boxShadow: "0 20px 60px rgba(0, 77, 64, 0.15)",
          overflow: "hidden",
          minHeight: "calc(100vh - 32px)",
        }}
        styles={{
          body: {
            padding: screens.xs ? "20px" : "32px",
          },
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: screens.xs ? "center" : "space-between",
            marginBottom: screens.xs ? "24px" : "32px",
            paddingBottom: "24px",
            borderBottom: `2px solid ${THEME_COLOR_LIGHT}`,
            flexDirection: screens.xs ? "column" : "row",
            gap: screens.xs ? "16px" : "0",
            textAlign: screens.xs ? "center" : "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexDirection: screens.xs ? "column" : "row",
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`,
                padding: screens.xs ? "10px" : "12px",
                borderRadius: "12px",
                fontSize: screens.xs ? "20px" : "24px",
                color: "white",
              }}
            >
              <BankOutlined />
            </div>
            <div>
              <Typography.Title
                level={screens.xs ? 3 : 2}
                style={{
                  margin: 0,
                  color: THEME_COLOR,
                  fontWeight: 700,
                  fontSize: screens.xs ? "24px" : "32px",
                }}
              >
                Member Contribution & Bill Management
              </Typography.Title>
              <Text
                type="secondary"
                style={{
                  fontSize: screens.xs ? "14px" : "16px",
                  display: "block",
                  marginTop: screens.xs ? "8px" : "4px",
                }}
              >
                Manage rent, bills, and track payments in one place
              </Text>
            </div>
          </div>

          {isManager && (
            <Tag
              color={THEME_COLOR}
              icon={<TeamOutlined />}
              style={{
                padding: screens.xs ? "6px 12px" : "8px 16px",
                borderRadius: "20px",
                fontSize: screens.xs ? "12px" : "14px",
                fontWeight: 600,
                border: "none",
              }}
            >
              Manager View
            </Tag>
          )}
        </div>

        {screens.xs ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isManager ? "1fr 1fr" : "1fr",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            <Button
              type={activeTab === "contributions" ? "primary" : "default"}
              icon={<DashboardOutlined />}
              onClick={() => setActiveTab("contributions")}
              style={{
                height: "48px",
                borderRadius: "8px",
                background:
                  activeTab === "contributions"
                    ? `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`
                    : undefined,
                border:
                  activeTab === "contributions"
                    ? "none"
                    : `1px solid ${THEME_COLOR}`,
              }}
            >
              <Text
                style={{
                  fontSize: "12px",
                  color: activeTab === "contributions" ? "#fff" : THEME_COLOR,
                }}
              >
                Dashboard
              </Text>
            </Button>

            {isManager && (
              <Button
                type={activeTab === "status" ? "primary" : "default"}
                icon={<TeamOutlined />}
                onClick={() => setActiveTab("status")}
                style={{
                  height: "48px",
                  borderRadius: "8px",
                  background:
                    activeTab === "status"
                      ? `linear-gradient(135deg, ${THEME_COLOR}, ${THEME_COLOR_DARK})`
                      : undefined,
                  border:
                    activeTab === "status"
                      ? "none"
                      : `1px solid ${THEME_COLOR}`,
                }}
              >
                <Text
                  style={{
                    fontSize: "12px",
                    color: activeTab === "status" ? "#fff" : THEME_COLOR,
                  }}
                >
                  Status
                </Text>
              </Button>
            )}
          </div>
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{
              background: "#fff",
            }}
            tabBarStyle={{
              background: "linear-gradient(90deg, #f8fafc 0%, #fff 100%)",
              padding: "8px 16px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: `1px solid ${THEME_COLOR_LIGHT}`,
            }}
          />
        )}

        {screens.xs && (
          <div style={{ marginTop: "24px" }}>
            {activeTab === "contributions" && tabItems[0].children}
            {activeTab === "status" && isManager && tabItems[1].children}
          </div>
        )}
      </Card>

      <style jsx global>{`
        .modern-card:hover {
          transform: translateY(-4px);
          transition: all 0.3s ease;
        }

        .ant-table-thead > tr > th {
          background: linear-gradient(
            135deg,
            ${THEME_COLOR},
            ${THEME_COLOR_DARK}
          ) !important;
          color: white !important;
          font-weight: 600 !important;
          border: none !important;
        }

        .ant-table-tbody > tr:hover > td {
          background: ${THEME_COLOR_LIGHT} !important;
        }

        .ant-tabs-tab {
          border-radius: 8px !important;
          padding: 12px 20px !important;
          border: 1px solid ${THEME_COLOR_LIGHT} !important;
          transition: all 0.3s ease !important;
          background: white !important;
        }

        .ant-tabs-tab-active {
          background: linear-gradient(
            135deg,
            ${THEME_COLOR},
            ${THEME_COLOR_DARK}
          ) !important;
          border: 1px solid ${THEME_COLOR} !important;
        }

        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: white !important;
        }

        .ant-tabs-tab:not(.ant-tabs-tab-active) .ant-tabs-tab-btn {
          color: ${THEME_COLOR} !important;
        }

        .ant-select-selector {
          border-radius: 8px !important;
          border: 1px solid ${THEME_COLOR_LIGHT} !important;
        }

        .ant-input-number,
        .ant-input {
          border-radius: 8px !important;
          border: 1px solid ${THEME_COLOR_LIGHT} !important;
        }

        .ant-input-number:focus,
        .ant-input:focus,
        .ant-input-number-focused,
        .ant-input-focused {
          border-color: ${THEME_COLOR} !important;
          box-shadow: 0 0 0 2px ${THEME_COLOR}33 !important;
        }

        .ant-select-focused .ant-select-selector {
          border-color: ${THEME_COLOR} !important;
          box-shadow: 0 0 0 2px ${THEME_COLOR}33 !important;
        }
      `}</style>
    </div>
  );
}

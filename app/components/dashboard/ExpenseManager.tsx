"use client";

import React, { useState, useMemo } from "react";
import { useExpenses } from "../../lib/hooks/useExpenses";
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
  message,
  Tag,
  Statistic,
  Select,
  Space,
  Divider,
} from "antd";
import {
  DollarOutlined,
  PlusOutlined,
  CalculatorOutlined,
  TeamOutlined,
  FireOutlined,
  WifiOutlined,
  BulbOutlined,
  DropboxOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

const EXPENSE_CATEGORIES = [
  { value: "gas", label: "Gas Bill", icon: <FireOutlined />, color: "orange" },
  {
    value: "internet",
    label: "Internet Bill",
    icon: <WifiOutlined />,
    color: "blue",
  },
  {
    value: "electricity",
    label: "Electricity Bill",
    icon: <BulbOutlined />,
    color: "volcano",
  },
  {
    value: "water",
    label: "Water Bill",
    icon: <DropboxOutlined />,
    color: "cyan",
  },
  {
    value: "cleaner",
    label: "Cleaner Salary",
    icon: <UserOutlined />,
    color: "green",
  },
  {
    value: "other_bills",
    label: "Other Bills",
    icon: <SettingOutlined />,
    color: "gray",
  },
  {
    value: "utility",
    label: "Utility Bills",
    icon: <TeamOutlined />,
    color: "purple",
  },
];

const AddExpenseForm: React.FC<{
  addExpense: (
    title: string,
    amount: number,
    category: any
  ) => Promise<boolean>;
  members: any[];
}> = ({ addExpense, members }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("gas");

  const onFinish = async (values: {
    description: string;
    amount: number;
    category: string;
  }) => {
    setSubmitting(true);
    const success = await addExpense(
      values.description,
      values.amount,
      values.category
    );
    setSubmitting(false);

    if (success) {
      message.success("Expense added successfully!");
      form.resetFields();
    } else {
      message.error("Failed to add expense. Please try again.");
    }
  };

  const activeMembers = members.filter((m) => m.role !== "pending");
  const categoryConfig = EXPENSE_CATEGORIES.find(
    (cat) => cat.value === selectedCategory
  );

  return (
    <Card title="Add New Expense" size="small">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ category: "gas" }}
      >
        <Form.Item
          name="category"
          label="Expense Category"
          rules={[{ required: true, message: "Please select a category" }]}
        >
          <Select placeholder="Select category" onChange={setSelectedCategory}>
            {EXPENSE_CATEGORIES.map((category) => (
              <Option key={category.value} value={category.value}>
                <Space>
                  {category.icon}
                  {category.label}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input placeholder={`e.g., Monthly ${categoryConfig?.label}`} />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Total Amount (৳)"
          rules={[{ required: true, message: "Please enter the amount" }]}
        >
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            placeholder="Total bill amount"
          />
        </Form.Item>

        {categoryConfig && (
          <div
            style={{
              padding: "12px",
              background: "#f0f8ff",
              borderRadius: "6px",
              marginBottom: "16px",
              border: "1px solid #d6e4ff",
            }}
          >
            <Text type="secondary">
              <CalculatorOutlined /> This {categoryConfig.label.toLowerCase()}{" "}
              will be divided among {activeMembers.length} members. Each member
              will need to pay:{" "}
              <Text strong>
                ৳
                {(
                  form.getFieldValue("amount") / activeMembers.length || 0
                ).toFixed(2)}
              </Text>
            </Text>
          </div>
        )}

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<PlusOutlined />}
            block
          >
            Add Expense
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

interface ExpenseManagerProps {
  messId: string;
}

export default function ExpenseManager({ messId }: ExpenseManagerProps) {
  const {
    expenses,
    members,
    loading,
    addExpense,
    totalContribution,
    getDividedExpensesSummary,
  } = useExpenses();
  const { isManager } = useAuth();

  const { totalOverhead, remainingBalance, dividedSummary } = useMemo(() => {
    const totalOverhead = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const remainingBalance = totalContribution - totalOverhead;
    const dividedSummary = getDividedExpensesSummary();

    return { totalOverhead, remainingBalance, dividedSummary };
  }, [expenses, totalContribution, getDividedExpensesSummary]);

  if (!isManager) {
    return (
      <Alert
        message="Access Denied"
        description="Only managers can access expense management."
        type="error"
        showIcon
      />
    );
  }

  if (loading) {
    return <Spin tip="Loading financial data..." />;
  }

  const activeMembers = members.filter((m) => m.role !== "pending");

  return (
    <div>
      <Title level={2} style={{ margin: "0 0 8px 0" }}>
        <DollarOutlined /> Expense Manager
      </Title>

      <p style={{ marginBottom: 16 }}>
        Manage all mess expenses. Divided expenses will be split equally among{" "}
        {activeMembers.length} active members.
      </p>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <div style={{ marginBottom: 16 }}>
            <AddExpenseForm addExpense={addExpense} members={members} />
          </div>

          <Card title="Financial Summary" size="small">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Statistic
                title="Total Member Contribution"
                value={totalContribution}
                prefix="৳"
                precision={2}
                valueStyle={{ color: "#3f8600" }}
              />
              <Statistic
                title="Total Expenses"
                value={totalOverhead}
                prefix="৳"
                precision={2}
                valueStyle={{ color: "#cf1322" }}
              />
              <Statistic
                title="Remaining Balance"
                value={remainingBalance}
                prefix="৳"
                precision={2}
                valueStyle={{
                  color: remainingBalance >= 0 ? "#3f8600" : "#cf1322",
                  fontWeight: "bold",
                }}
              />
            </Space>
          </Card>

          <Card
            title="Divided Expenses Summary"
            size="small"
            style={{ marginTop: 16 }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {Object.entries(dividedSummary).map(([category, data]) => {
                if (data.total > 0) {
                  const categoryConfig = EXPENSE_CATEGORIES.find(
                    (cat) => cat.value === category
                  );
                  return (
                    <div
                      key={category}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "4px 0",
                      }}
                    >
                      <Space size="small">
                        {categoryConfig?.icon}
                        <Text>{categoryConfig?.label}:</Text>
                      </Space>
                      <Space size="small">
                        <Text strong>৳{data.perMember}</Text>
                        <Text type="secondary">per member</Text>
                      </Space>
                    </div>
                  );
                }
                return null;
              })}
              {Object.values(dividedSummary).every(
                (data) => data.total === 0
              ) && <Text type="secondary">No divided expenses yet</Text>}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Expense History" size="small">
            <Table
              dataSource={expenses}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
              size="small"
              locale={{
                emptyText: (
                  <Alert
                    message="No expenses recorded yet."
                    type="info"
                    showIcon
                  />
                ),
              }}
            >
              <Column
                title="Date"
                dataIndex="date"
                key="date"
                width={100}
                render={(date: any) =>
                  date && date.toDate
                    ? moment(date.toDate()).format("MMM DD")
                    : "N/A"
                }
              />
              <Column
                title="Category"
                dataIndex="category"
                key="category"
                width={120}
                render={(category: string) => {
                  const categoryConfig = EXPENSE_CATEGORIES.find(
                    (cat) => cat.value === category
                  );
                  return (
                    <Tag
                      color={categoryConfig?.color || "blue"}
                      icon={categoryConfig?.icon}
                    >
                      {categoryConfig?.label || category}
                    </Tag>
                  );
                }}
                filters={EXPENSE_CATEGORIES.map((cat) => ({
                  text: cat.label,
                  value: cat.value,
                }))}
                onFilter={(value, record) => record.category === value}
              />
              <Column
                title="Description"
                dataIndex="title"
                key="title"
                ellipsis
              />
              <Column
                title="Total Amount"
                dataIndex="amount"
                key="amount"
                align="right"
                width={100}
                render={(amount: number) => (
                  <Text strong style={{ color: "#cf1322" }}>
                    ৳{amount.toFixed(2)}
                  </Text>
                )}
                sorter={(a, b) => a.amount - b.amount}
              />
              <Column
                title="Per Member"
                dataIndex="dividedAmount"
                key="dividedAmount"
                align="right"
                width={100}
                render={(dividedAmount: number, record: any) =>
                  record.dividedAmount ? (
                    <Text type="secondary">৳{dividedAmount.toFixed(2)}</Text>
                  ) : (
                    <Tag color="default">Not Divided</Tag>
                  )
                }
              />
              <Column
                title="Paid By"
                dataIndex="paidByName"
                key="paidByName"
                width={100}
                render={(name: string) => (
                  <Tag color="purple" style={{ margin: 0 }}>
                    {name}
                  </Tag>
                )}
              />
              <Column
                title="Members"
                dataIndex="totalMembers"
                key="totalMembers"
                width={80}
                align="center"
                render={(count: number) =>
                  count && <Tag icon={<TeamOutlined />}>{count}</Tag>
                }
              />
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

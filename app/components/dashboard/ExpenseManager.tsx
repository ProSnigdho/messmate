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
  HistoryOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

const PRIMARY_COLOR = "#00695C";
const SUCCESS_COLOR = "#3f8600";
const ERROR_COLOR = "#cf1322";

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
  const selectedCategoryValue = Form.useWatch("category", form) || "gas";

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
    (cat) => cat.value === selectedCategoryValue
  );

  const totalAmount = Form.useWatch("amount", form) || 0;
  const perMemberCost =
    activeMembers.length > 0 ? totalAmount / activeMembers.length : 0;

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
          <PlusOutlined style={{ marginRight: 8 }} /> Add New Expense
        </Title>
      }
      size="default"
      className="shadow-xl"
      style={{
        marginBottom: 24,
        borderColor: PRIMARY_COLOR,
        borderTop: `4px solid ${PRIMARY_COLOR}`,
        borderRadius: "10px",
      }}
      styles={{
        body: { padding: 24 },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ category: "gas" }}
      >
        <Form.Item
          name="category"
          label={
            <Text strong style={{ fontSize: "1rem" }}>
              Expense Category
            </Text>
          }
          rules={[{ required: true, message: "Please select a category" }]}
        >
          <Select placeholder="Select category" size="large">
            {EXPENSE_CATEGORIES.map((category) => (
              <Option key={category.value} value={category.value}>
                <Space style={{ fontSize: "1rem" }}>
                  {category.icon}
                  {category.label}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label={
            <Text strong style={{ fontSize: "1rem" }}>
              Description
            </Text>
          }
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input
            placeholder={`e.g., Monthly ${categoryConfig?.label}`}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label={
            <Text strong style={{ fontSize: "1rem" }}>
              Total Amount (৳)
            </Text>
          }
          rules={[{ required: true, message: "Please enter the amount" }]}
        >
          <InputNumber
            min={1}
            size="large"
            style={{ width: "100%", fontSize: "1rem" }}
            placeholder="Total bill amount"
            formatter={(value) =>
              `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value: string | undefined) => {
              const cleanedValue = value ? value.replace(/৳\s?|(,*)/g, "") : "";
              return parseFloat(cleanedValue) || 0;
            }}
          />
        </Form.Item>

        {categoryConfig && (
          <div
            style={{
              padding: "16px",
              background: "#e0f2f1",
              borderRadius: "8px",
              marginBottom: "24px",
              border: `1px solid ${PRIMARY_COLOR}`,
            }}
          >
            <Text type="secondary" style={{ display: "block", fontSize: 14 }}>
              <CalculatorOutlined
                style={{ marginRight: 5, color: PRIMARY_COLOR }}
              />
              This **{categoryConfig.label}** will be divided among **
              {activeMembers.length}** active members.
            </Text>
            <Divider style={{ margin: "8px 0" }} />
            <Text strong style={{ color: PRIMARY_COLOR, fontSize: 18 }}>
              Each member's share:
              <span style={{ float: "right" }}>
                ৳{perMemberCost.toFixed(2)}
              </span>
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
            size="large"
            style={{
              height: 55,
              fontSize: 20,
              fontWeight: "bold",
              backgroundColor: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
            }}
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
        style={{ margin: 24 }}
      />
    );
  }

  if (loading) {
    return (
      <Row justify="center" style={{ minHeight: "80vh", alignItems: "center" }}>
        <Spin tip="Loading financial data..." size="large" />
      </Row>
    );
  }

  const activeMembers = members.filter((m) => m.role !== "pending");

  return (
    <div style={{ padding: "0 16px" }}>
      <Title
        level={2}
        style={{ margin: "0 0 8px 0", color: PRIMARY_COLOR, fontWeight: "800" }}
      >
        <DollarOutlined style={{ marginRight: 8 }} /> Expense Manager
      </Title>

      <Text
        type="secondary"
        style={{ display: "block", marginBottom: 24, fontSize: "16px" }}
      >
        Manage all mess expenses. Divided expenses will be split equally among{" "}
        <Text strong style={{ color: PRIMARY_COLOR }}>
          {activeMembers.length}
        </Text>{" "}
        active members.
      </Text>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <AddExpenseForm addExpense={addExpense} members={members} />

          <Card
            title={
              <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
                Financial Summary
              </Title>
            }
            size="default"
            className="shadow-xl"
            style={{
              borderRadius: "10px",
              marginBottom: 24,
              borderTop: `4px solid ${PRIMARY_COLOR}`,
            }}
            styles={{
              body: { padding: 24 },
            }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Statistic
                title="Total Member Contribution"
                value={totalContribution}
                prefix="৳"
                precision={2}
                valueStyle={{ color: SUCCESS_COLOR, fontSize: 32 }}
              />
              <Statistic
                title="Total Expenses"
                value={totalOverhead}
                prefix="৳"
                precision={2}
                valueStyle={{ color: ERROR_COLOR, fontSize: 32 }}
              />
              <Divider style={{ margin: "8px 0" }} />
              <Statistic
                title="Remaining Balance"
                value={remainingBalance}
                prefix="৳"
                precision={2}
                valueStyle={{
                  color: remainingBalance >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                  fontWeight: "bold",
                  fontSize: 32,
                }}
              />
            </Space>
          </Card>

          <Card
            title={
              <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
                Divided Expenses Summary
              </Title>
            }
            size="default"
            className="shadow-xl"
            style={{
              borderRadius: "10px",
              borderLeft: `4px solid ${PRIMARY_COLOR}`,
            }}
            styles={{
              body: { padding: 24 },
            }}
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
                        padding: "8px 0",
                        borderBottom: "1px dotted #f0f0f0",
                      }}
                    >
                      <Space size="middle">
                        <Tag
                          color={categoryConfig?.color || "blue"}
                          style={{ margin: 0, fontSize: 14 }}
                        >
                          {categoryConfig?.icon}
                        </Tag>
                        <Text strong style={{ fontSize: 16 }}>
                          {categoryConfig?.label}
                        </Text>
                      </Space>
                      <Text
                        strong
                        style={{ color: PRIMARY_COLOR, fontSize: 18 }}
                      >
                        ৳{data.perMember.toFixed(2)}
                      </Text>
                    </div>
                  );
                }
                return null;
              })}
              {Object.values(dividedSummary).every(
                (data) => data.total === 0
              ) && (
                <Text type="secondary">
                  No divided expenses yet this month.
                </Text>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
                <HistoryOutlined style={{ marginRight: 8 }} /> Expense History
              </Title>
            }
            size="default"
            className="shadow-xl"
            style={{
              borderRadius: "10px",
              borderLeft: `4px solid ${PRIMARY_COLOR}`,
            }}
            styles={{
              body: { padding: 12 },
            }}
          >
            <Table
              dataSource={expenses}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
              size="large"
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
                key="date"
                width={120}
                render={(text, record: any) => {
                  const date = record.date;
                  if (date && typeof date.toDate === "function") {
                    return moment(date.toDate()).format("MMM DD, YYYY");
                  }
                  if (date && date.seconds) {
                    return moment.unix(date.seconds).format("MMM DD, YYYY");
                  }
                  return "N/A";
                }}
              />
              <Column
                title="Category"
                dataIndex="category"
                key="category"
                width={150}
                render={(category: string) => {
                  const categoryConfig = EXPENSE_CATEGORIES.find(
                    (cat) => cat.value === category
                  );
                  return (
                    <Tag
                      color={categoryConfig?.color || "blue"}
                      icon={categoryConfig?.icon}
                      style={{ fontSize: 14, padding: "6px 10px" }}
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
                render={(text: string) => (
                  <Text style={{ fontSize: 15 }}>{text}</Text>
                )}
              />
              <Column
                title="Total Amount"
                dataIndex="amount"
                key="amount"
                align="right"
                width={120}
                render={(amount: number) => (
                  <Text strong style={{ color: ERROR_COLOR, fontSize: 16 }}>
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
                width={120}
                render={(dividedAmount: number) =>
                  dividedAmount ? (
                    <Text type="secondary" style={{ fontSize: 15 }}>
                      ৳{dividedAmount.toFixed(2)}
                    </Text>
                  ) : (
                    <Tag color="default" style={{ fontSize: 13 }}>
                      Not Divided
                    </Tag>
                  )
                }
              />
              <Column
                title="Paid By"
                dataIndex="paidByName"
                key="paidByName"
                width={120}
                render={(name: string) => (
                  <Tag
                    color={PRIMARY_COLOR}
                    style={{ margin: 0, color: "white", fontSize: 14 }}
                  >
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
                  count && (
                    <Tag
                      icon={<TeamOutlined />}
                      color="geekblue"
                      style={{ fontSize: 14 }}
                    >
                      {count}
                    </Tag>
                  )
                }
              />
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

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
} from "antd";
import {
  DollarOutlined,
  PlusOutlined,
  CalculatorOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;
const { Column } = Table;

// --- AddExpenseForm Component ---
const AddExpenseForm: React.FC<{
  addExpense: (title: string, amount: number) => Promise<boolean>;
}> = ({ addExpense }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { description: string; amount: number }) => {
    setSubmitting(true);
    const success = await addExpense(values.description, values.amount);
    setSubmitting(false);

    if (success) {
      message.success("Mess overhead expense added successfully!");
      form.resetFields();
    } else {
      message.error("Failed to add expense. Please try again.");
    }
  };

  return (
    <Card title="Add New Mess Overhead" size="small">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Please enter a description" }]}
          style={{ marginBottom: 12 }}
        >
          <Input placeholder="Monthly utility payment" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount (৳)"
          rules={[{ required: true, message: "Please enter the amount" }]}
          style={{ marginBottom: 16 }}
        >
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            placeholder="Amount spent"
          />
        </Form.Item>

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

// --- Main ExpenseManager Component ---
export default function ExpenseManager({ messId }: ExpenseManagerProps) {
  const { expenses, loading, addExpense, totalContribution } = useExpenses();
  const { isManager } = useAuth();

  const { totalOverhead, remainingBalance } = useMemo(() => {
    const totalOverhead = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const remainingBalance = totalContribution - totalOverhead;
    return { totalOverhead, remainingBalance };
  }, [expenses, totalContribution]);

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

  return (
    <div>
      <Title level={2} style={{ margin: "0 0 8px 0" }}>
        <DollarOutlined /> Mess Overhead Manager
      </Title>

      <p style={{ marginBottom: 16 }}>
        Manage all non-meal related monthly mess expenses (Utilities, Rent,
        etc.).
      </p>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <div style={{ marginBottom: 16 }}>
            <AddExpenseForm addExpense={addExpense} />
          </div>

          <Card title="Financial Summary" size="small">
            <Row gutter={[12, 12]}>
              <Col span={24}>
                <Statistic
                  title="Total Member Contribution"
                  value={totalContribution}
                  prefix="৳"
                  precision={2}
                  valueStyle={{ color: "#3f8600", fontSize: "16px" }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Total Overhead Expense"
                  value={totalOverhead}
                  prefix="৳"
                  precision={2}
                  valueStyle={{ color: "#cf1322", fontSize: "16px" }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Remaining Balance"
                  value={remainingBalance}
                  prefix="৳"
                  precision={2}
                  valueStyle={{
                    color: remainingBalance >= 0 ? "#3f8600" : "#cf1322",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Monthly Overhead History" size="small">
            <Table
              dataSource={expenses}
              rowKey="id"
              pagination={{ pageSize: 8, size: "small" }}
              scroll={{ x: 600 }}
              size="small"
              locale={{
                emptyText: (
                  <Alert
                    message="No non-meal expenses recorded yet."
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
                width={120}
                render={(date: any) =>
                  date && date.toDate
                    ? moment(date.toDate()).format("MMM DD")
                    : "N/A"
                }
              />
              <Column
                title="Description"
                dataIndex="title"
                key="title"
                ellipsis
              />
              <Column
                title="Amount"
                dataIndex="amount"
                key="amount"
                align="right"
                width={100}
                render={(amount: number) => (
                  <Text strong style={{ color: "#cf1322" }}>
                    ৳{amount.toFixed(2)}
                  </Text>
                )}
              />
              <Column
                title="Paid By"
                dataIndex="paidByName"
                key="paidByName"
                width={100}
                render={(name: string) => (
                  <Tag
                    icon={<TeamOutlined />}
                    color="purple"
                    style={{ margin: 0 }}
                  >
                    {name}
                  </Tag>
                )}
              />
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

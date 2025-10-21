"use client";

import React, { useState } from "react";
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
} from "antd";
import { DollarOutlined, PlusOutlined } from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;
const { Column } = Table;

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
    <Card title={<Title level={4}>Add New Mess Overhead</Title>} size="small">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="description"
          label="Description (e.g., Room Rent, Gas Bill, Broker Fee)"
          rules={[{ required: true, message: "Please enter a description" }]}
        >
          <Input placeholder="Monthly utility payment" />
        </Form.Item>
        <Form.Item
          name="amount"
          label="Amount (৳)"
          rules={[{ required: true, message: "Please enter the amount" }]}
        >
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            placeholder="Amount spent"
          />
        </Form.Item>
        <Form.Item>
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
  const { expenses, loading, addExpense } = useExpenses();
  const { isManager } = useAuth();

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
    return <Spin tip="Loading overhead expenses..." />;
  }

  return (
    <div>
      <Title level={2} style={{ margin: 0 }}>
        <DollarOutlined /> Mess Overhead Manager
      </Title>
      <p style={{ marginBottom: 20 }}>
        Manage all non-meal related monthly mess expenses (Utilities, Rent,
        etc.).
      </p>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <AddExpenseForm addExpense={addExpense} />
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={<Title level={4}>Monthly Overhead History</Title>}
            size="small"
          >
            <Table
              dataSource={expenses}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 600 }}
              locale={{
                emptyText: (
                  <Alert
                    message="No non-meal expenses recorded yet."
                    type="info"
                  />
                ),
              }}
            >
              <Column
                title="Date"
                dataIndex="date"
                key="date"
                render={(date: any) =>
                  date && date.toDate
                    ? moment(date.toDate()).format("MMM DD, h:mm a")
                    : "N/A"
                }
              />
              <Column title="Description" dataIndex="title" key="title" />
              <Column
                title="Amount (৳)"
                dataIndex="amount"
                key="amount"
                align="right"
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
                render={(name: string) => <Tag color="geekblue">{name}</Tag>}
              />
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

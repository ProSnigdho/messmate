"use client";

import React, { useState } from "react";
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
  message,
  Tag,
  Select,
} from "antd";
import {
  BankOutlined,
  DollarCircleOutlined,
  TagOutlined,
} from "@ant-design/icons";
import moment from "moment";
import type { Deposit as DepositType, UserProfile } from "../../lib/types";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

const transactionCategories = [
  { value: "Personal Contribution", label: "Deposit" },
  { value: "Rent", label: "Rent" },
  {
    value: "Utility Bill (Electricity/Water)",
    label: "Utility Bill",
  },
  { value: "Gas Bill", label: "Gas Bill" },
  { value: "Internet/Cable", label: "Internet/Cable" },
  { value: "Others (General Expense)", label: "Others" },
];

const AddTransactionForm: React.FC<{
  members: UserProfile[];
  addTransaction: (
    category: string,
    amount: number,
    involvedUid: string,
    description: string
  ) => Promise<boolean>;
}> = ({ members, addTransaction }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const onFinish = async (values: {
    category: string;
    involvedUid: string;
    amount: number;
    description: string;
  }) => {
    setSubmitting(true);
    const success = await addTransaction(
      values.category,
      values.amount,
      values.involvedUid,
      values.description
    );
    setSubmitting(false);

    if (success) {
      form.resetFields();
      form.setFieldsValue({ involvedUid: user?.uid });
    }
  };

  const selectedCategory = Form.useWatch("category", form);
  const involvedMemberLabel =
    selectedCategory === "Personal Contribution" ? "Deposited By" : "Paid By";
  const buttonText =
    selectedCategory === "Personal Contribution"
      ? "Record Deposit"
      : "Record Expense";

  return (
    <Card
      title={
        <Title level={4}>
          <DollarCircleOutlined /> Record New Transaction
        </Title>
      }
      size="small"
      style={{ marginBottom: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ involvedUid: user?.uid }}
      >
        <Form.Item
          name="category"
          label="Transaction Type"
          rules={[
            { required: true, message: "Please select a transaction type" },
          ]}
        >
          <Select placeholder="Select Deposit or Expense type">
            {transactionCategories.map((cat) => (
              <Option key={cat.value} value={cat.value}>
                {cat.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="involvedUid"
          label={involvedMemberLabel}
          rules={[
            { required: true, message: "Please select the involved member" },
          ]}
        >
          <Select placeholder="Select the involved member">
            {members.map((member) => (
              <Option key={member.uid} value={member.uid}>
                {member.displayName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Amount (৳)"
              rules={[{ required: true, message: "Enter the amount" }]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                placeholder="Total amount"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label="Details (Optional)">
              <Input placeholder="e.g., Nov Deposit, Dec Rent" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<BankOutlined />}
            block
            disabled={!selectedCategory}
          >
            {buttonText}
          </Button>
        </Form.Item>
      </Form>
    </Card>
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
  } = useDeposits();

  const { loading: authLoading } = useAuth();

  if (authLoading || depositsLoading) {
    return <Spin tip="Loading transaction history..." />;
  }

  return (
    <Card className="shadow-lg">
      <Title
        level={2}
        style={{
          margin: 0,
          borderBottom: "1px solid #f0f0f0",
          paddingBottom: 10,
        }}
      >
        <BankOutlined /> **Financial Transaction Manager**
      </Title>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={8}>
          {isManager ? (
            <AddTransactionForm
              members={members}
              addTransaction={addTransaction}
            />
          ) : (
            <Alert
              message="Access Restricted"
              description="Only Mess Managers can record any financial transaction (Deposits or Expenses)."
              type="error"
              showIcon
            />
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={<Title level={4}>Recent Transactions</Title>}
            size="small"
          >
            <Table
              dataSource={deposits}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 600 }}
              locale={{
                emptyText: (
                  <Alert message="No transactions recorded yet." type="info" />
                ),
              }}
            >
              <Column
                title="Date"
                dataIndex="date"
                key="date"
                width={140}
                render={(date: any) =>
                  date && date.toDate
                    ? moment(date.toDate()).format("MMM DD, h:mm a")
                    : "N/A"
                }
              />
              <Column
                title="Type"
                dataIndex="category"
                key="category"
                width={150}
                render={(category: string) => (
                  <Tag
                    color={
                      category === "Personal Contribution" ? "green" : "volcano"
                    }
                    icon={<TagOutlined />}
                  >
                    {category}
                  </Tag>
                )}
              />
              <Column
                title="Amount (৳)"
                dataIndex="amount"
                key="amount"
                width={120}
                align="right"
                render={(amount: number, record: DepositType) => (
                  <Text
                    strong
                    style={{
                      color:
                        record.category === "Personal Contribution"
                          ? "#389e0d"
                          : "#cf1322",
                    }}
                  >
                    ৳{amount ? amount.toFixed(2) : "0.00"}
                  </Text>
                )}
              />
              <Column
                title="Involved Member"
                dataIndex="userName"
                key="userName"
                width={140}
                render={(name: string) => <Tag color="blue">{name}</Tag>}
              />
              <Column
                title="Details/Comment"
                dataIndex="description"
                key="description"
              />
            </Table>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

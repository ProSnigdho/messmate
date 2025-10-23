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
} from "antd";
import {
  BankOutlined,
  DollarCircleOutlined,
  TagOutlined,
  FilterOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import type { Deposit as DepositType, UserProfile } from "../../lib/types";

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

const transactionCategories = [
  { value: "Personal Contribution", label: "Monthly Contribution" },
  { value: "Rent Contribution", label: "Rent Payment Share" },
  {
    value: "Utility Contribution",
    label: "Utility Bill Share",
  },
  { value: "Gas Contribution", label: "Gas Bill Share" },
  { value: "Internet Contribution", label: "Internet/Cable Share" },
  { value: "Other Contribution", label: "Other Funds/Share" },
];

// --- Form Component (No Change) ---
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
    await addTransaction(
      values.category,
      values.amount,
      values.involvedUid,
      values.description
    );
    setSubmitting(false);

    form.resetFields();
    form.setFieldsValue({ involvedUid: user?.uid });
  };

  const involvedMemberLabel = "Contributed By";
  const buttonText = "Record Contribution";

  return (
    <Card
      title={
        <Title level={4}>
          <DollarCircleOutlined /> Record New Contribution
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
          label="Contribution Type"
          rules={[
            { required: true, message: "Please select a contribution type" },
          ]}
        >
          <Select placeholder="Select the type of contribution">
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
            {
              required: true,
              message: "Please select the contributing member",
            },
          ]}
        >
          <Select placeholder="Select the contributing member">
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
              <Input placeholder="e.g., Nov Contribution, Rent Share" />
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
          >
            {buttonText}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

// --- Main Deposit Component ---
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
  const { user, loading: authLoading } = useAuth();

  // For members: automatically filter to show only their own contributions
  // For managers: show all with filter option
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    isManager ? "all" : user?.uid || "all"
  );

  // Filter deposits based on user role
  const filteredDeposits = useMemo(() => {
    if (!isManager) {
      // Members can only see their own contributions
      return deposits.filter((dep) => dep.userId === user?.uid);
    } else {
      // Managers can see all or filtered by member
      if (selectedMemberId === "all") {
        return deposits;
      }
      return deposits.filter((dep) => dep.userId === selectedMemberId);
    }
  }, [deposits, selectedMemberId, isManager, user?.uid]);

  // Calculate total contribution based on filtered deposits
  const { totalContribution, userTotalContribution } = useMemo(() => {
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
    };
  }, [filteredDeposits, user?.uid]);

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
        <BankOutlined /> Member Contribution Tracker
      </Title>

      <Row gutter={[16, 16]} className="mt-4">
        {/* Left Column: Form / Access Alert / Summary */}
        <Col xs={24} lg={8}>
          {isManager ? (
            <AddTransactionForm
              members={members}
              addTransaction={addTransaction}
            />
          ) : (
            <Alert
              message="Member View"
              description="Only Mess Managers can record financial contributions. You can view your own contribution history below."
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {/* Total Summary Card */}
          <Card size="small" title={<Title level={4}>Summary</Title>}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic
                  title={
                    isManager
                      ? selectedMemberId !== "all"
                        ? "Total Individual Contribution"
                        : "Total Mess Contribution"
                      : "Your Total Contribution"
                  }
                  value={isManager ? totalContribution : userTotalContribution}
                  prefix="৳"
                  precision={2}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Col>
              {!isManager && (
                <Col span={24}>
                  <div
                    style={{
                      padding: "8px",
                      background: "#f6ffed",
                      borderRadius: "6px",
                      border: "1px solid #b7eb8f",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      <EyeInvisibleOutlined /> You can only view your own
                      contributions
                    </Text>
                  </div>
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        {/* Right Column: Transaction Table and Filter */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Title level={4} style={{ margin: 0 }}>
                  {isManager ? "All Contributions" : "Your Contributions"}
                </Title>
                {!isManager && (
                  <Tag icon={<EyeOutlined />} color="blue">
                    Personal View
                  </Tag>
                )}
              </div>
            }
            size="small"
          >
            {/* Manager Filter - Only show for managers */}
            {isManager && (
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Text strong style={{ marginRight: 8 }}>
                  <FilterOutlined /> Filter by Member:
                </Text>
                <Select
                  placeholder="View All Members"
                  style={{ width: 250 }}
                  value={selectedMemberId}
                  onChange={(value) => {
                    if (value === undefined) {
                      setSelectedMemberId("all");
                    } else {
                      setSelectedMemberId(value);
                    }
                  }}
                >
                  <Option value="all" key="all">
                    View All Members
                  </Option>
                  {members.map((member) => (
                    <Option key={member.uid} value={member.uid}>
                      {member.displayName}
                    </Option>
                  ))}
                </Select>
              </div>
            )}

            {/* Member View Notice */}
            {!isManager && (
              <Alert
                message="Personal Contribution History"
                description="This table shows only your personal contribution records. Other members' contributions are not visible to you."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Table
              dataSource={filteredDeposits}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 600 }}
              locale={{
                emptyText: (
                  <Alert
                    message={
                      isManager
                        ? "No contributions recorded yet."
                        : "You haven't made any contributions yet."
                    }
                    type="info"
                  />
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
                title="Contribution Type"
                dataIndex="category"
                key="category"
                width={150}
                render={(category: string) => (
                  <Tag color="green" icon={<TagOutlined />}>
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
                render={(amount: number) => (
                  <Text strong style={{ color: "#389e0d" }}>
                    ৳{amount ? amount.toFixed(2) : "0.00"}
                  </Text>
                )}
              />
              <Column
                title="Contributed By"
                dataIndex="userName"
                key="userName"
                width={140}
                render={(name: string, record: any) => (
                  <Tag
                    color={record.userId === user?.uid ? "blue" : "default"}
                    icon={
                      record.userId === user?.uid ? <EyeOutlined /> : undefined
                    }
                  >
                    {name} {record.userId === user?.uid && "(You)"}
                  </Tag>
                )}
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

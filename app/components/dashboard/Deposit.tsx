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
} from "antd";
import {
  BankOutlined,
  DollarCircleOutlined,
  TagOutlined,
  FilterOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
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

const DEPOSIT_CATEGORIES = [
  {
    value: "rent",
    label: "Home Rent",
    color: "volcano",
    icon: <HomeOutlined />,
  },
  {
    value: "gas_contribution",
    label: "Gas Bill Share",
    color: "orange",
    icon: <FireOutlined />,
  },
  {
    value: "internet_contribution",
    label: "Internet Bill Share",
    color: "blue",
    icon: <WifiOutlined />,
  },
  {
    value: "electricity_contribution",
    label: "Electricity Bill Share",
    color: "volcano",
    icon: <BulbOutlined />,
  },
  {
    value: "water_contribution",
    label: "Water Bill Share",
    color: "cyan",
    icon: <DropboxOutlined />,
  },
  {
    value: "cleaner_contribution",
    label: "Cleaner Salary Share",
    color: "green",
    icon: <UserOutlined />,
  },
  {
    value: "other_bills_contribution",
    label: "Other Bills Share",
    color: "gray",
    icon: <SettingOutlined />,
  },
  {
    value: "utility_contribution",
    label: "Utility Bill Share",
    color: "purple",
    icon: <HomeOutlined />,
  },
];

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
    <Card
      title={
        <Title level={4}>
          <HomeOutlined /> Record Rent Payment
        </Title>
      }
      size="small"
      style={{ marginBottom: 20 }}
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
          >
            {members.map((member) => (
              <Option key={member.uid} value={member.uid}>
                {member.displayName} - Rent: ৳
                {(member.monthlyRent || 0) + (member.customRent || 0)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedMemberData && rentStatus && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 6,
            }}
          >
            <Text strong>
              Rent Status for {selectedMemberData.displayName}:
            </Text>
            <div style={{ marginTop: 8 }}>
              <Text>Total Rent: ৳{rentStatus.totalRent}</Text>
              <br />
              <Text>Paid: ৳{rentStatus.paid}</Text>
              <br />
              <Text>Remaining: ৳{rentStatus.remaining}</Text>
              <br />
              <Progress
                percent={Math.round(
                  (rentStatus.paid / rentStatus.totalRent) * 100
                )}
                size="small"
                status={rentStatus.isFullyPaid ? "success" : "active"}
              />
            </div>
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
          />
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
                placeholder="Rent amount"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label="Details (Optional)">
              <Input placeholder="e.g., November Rent, Advance Rent" />
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
          >
            Record Rent Payment
          </Button>
        </Form.Item>
      </Form>
    </Card>
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

  return (
    <Card
      title={
        <Title level={4}>
          <DollarCircleOutlined /> Record Bill Payment
        </Title>
      }
      size="small"
      style={{ marginBottom: 20 }}
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
              padding: "12px",
              background: "#e6f7ff",
              borderRadius: "6px",
              marginBottom: "16px",
              border: "1px solid #91d5ff",
            }}
          >
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text strong>📊 Total Bill Information:</Text>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Total Bill Amount:</Text>
                <Text strong>৳{totalDue.toFixed(2)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Total Collected:</Text>
                <Text strong style={{ color: "#389e0d" }}>
                  ৳{totalPaid.toFixed(2)}
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Total Remaining:</Text>
                <Text strong type={totalRemaining > 0 ? "danger" : "success"}>
                  ৳{totalRemaining.toFixed(2)}
                </Text>
              </div>
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
              />
              <Text type="secondary" style={{ fontSize: "12px" }}>
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
              padding: "12px",
              background: "#fff2e8",
              borderRadius: "6px",
              marginBottom: "16px",
              border: "1px solid #ffbb96",
            }}
          >
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text strong>👤 Individual Share:</Text>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Member's Share:</Text>
                <Text strong>৳{memberDue.toFixed(2)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Already Paid:</Text>
                <Text strong>৳{memberPaid.toFixed(2)}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Remaining:</Text>
                <Text strong type={memberRemaining > 0 ? "danger" : "success"}>
                  ৳{memberRemaining.toFixed(2)}
                </Text>
              </div>
              {memberRemaining > 0 && (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  💡 Suggested amount: ৳{memberRemaining.toFixed(2)}
                </Text>
              )}
            </Space>
          </div>
        )}

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
                placeholder="Payment amount"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="description" label="Details (Optional)">
              <Input placeholder="e.g., November Gas Bill, Partial Payment" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<DollarCircleOutlined />}
            block
          >
            Record Bill Payment
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

const RentStatusTable: React.FC<{
  members: UserProfile[];
  getMemberRentStatus: (member: UserProfile) => any;
}> = ({ members, getMemberRentStatus }) => {
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
    <Card title="🏠 Monthly Rent Collection Status" size="small">
      <Table
        dataSource={rentData}
        pagination={false}
        scroll={{ x: 600 }}
        size="small"
      >
        <Column title="Member" dataIndex="name" key="name" width={120} />
        <Column
          title="Total Rent"
          dataIndex="totalRent"
          key="totalRent"
          align="right"
          width={100}
          render={(amount) => `৳${amount}`}
        />
        <Column
          title="Paid"
          dataIndex="paid"
          key="paid"
          align="right"
          width={100}
          render={(amount) => `৳${amount}`}
        />
        <Column
          title="Remaining"
          dataIndex="remaining"
          key="remaining"
          align="right"
          width={100}
          render={(amount, record: any) => (
            <Text type={amount > 0 ? "danger" : "success"}>৳{amount}</Text>
          )}
        />
        <Column
          title="Progress"
          dataIndex="progress"
          key="progress"
          width={150}
          render={(percent, record: any) => (
            <Progress
              percent={Math.round(percent)}
              size="small"
              status={record.isFullyPaid ? "success" : "active"}
            />
          )}
        />
        <Column
          title="Status"
          dataIndex="isFullyPaid"
          key="isFullyPaid"
          width={100}
          align="center"
          render={(isFullyPaid) => (
            <Tag
              color={isFullyPaid ? "green" : "orange"}
              icon={
                isFullyPaid ? (
                  <CheckCircleOutlined />
                ) : (
                  <ExclamationCircleOutlined />
                )
              }
            >
              {isFullyPaid ? "Paid" : "Pending"}
            </Tag>
          )}
        />
      </Table>
    </Card>
  );
};

const BillDueStatusTable: React.FC<{
  members: UserProfile[];
  getMemberDueAmount: (category: DepositCategory, memberId?: string) => number;
  getMemberPaidAmount: (memberId: string, category: DepositCategory) => number;
}> = ({ members, getMemberDueAmount, getMemberPaidAmount }) => {
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
    <Card title="📊 Bill Payment Status" size="small">
      <Table
        dataSource={billData}
        pagination={false}
        scroll={{ x: 1000 }}
        size="small"
      >
        <Column
          title="Member"
          dataIndex="name"
          key="name"
          width={120}
          fixed="left"
        />

        {billCategories.map((category) => (
          <Column
            key={category.value}
            title={
              <Space size="small">
                {category.icon}
                <Text>{category.label.split(" ")[0]}</Text>
              </Space>
            }
            width={120}
            align="center"
            render={(_, record: any) => {
              const bill = record[category.value];
              if (!bill || bill.due === 0) {
                return <Tag color="default">No Due</Tag>;
              }

              return (
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: "10px" }}>
                    Due: ৳{bill.due.toFixed(0)}
                  </Text>
                  <Text style={{ fontSize: "11px" }}>
                    Paid: ৳{bill.paid.toFixed(0)}
                  </Text>
                  <Tag
                    color={bill.isPaid ? "green" : "orange"}
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      padding: "2px 6px",
                      lineHeight: "14px",
                    }}
                  >
                    {bill.isPaid
                      ? "Paid"
                      : `Due: ৳${bill.remaining.toFixed(0)}`}
                  </Tag>
                </Space>
              );
            }}
          />
        ))}
      </Table>
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
    getTotalDueAmount,
    getTotalPaidAmount,
    getMemberDueAmount,
    getMemberPaidAmount,
    getMemberRentStatus,
    getRentSummary,
  } = useDeposits();
  const { user, loading: authLoading } = useAuth();

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
      label: "💰 Contributions & Payments",
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            {isManager ? (
              <>
                <RentPaymentForm
                  members={members}
                  addTransaction={addTransaction}
                  getMemberRentStatus={getMemberRentStatus}
                />
                <BillPaymentForm
                  members={members}
                  addTransaction={addTransaction}
                  getTotalDueAmount={getTotalDueAmount}
                  getTotalPaidAmount={getTotalPaidAmount}
                  getMemberDueAmount={getMemberDueAmount}
                  getMemberPaidAmount={getMemberPaidAmount}
                />
              </>
            ) : (
              <Alert
                message="View Only Access"
                description="Only managers can record payments. Please contact your mess manager for any payment related queries."
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
              />
            )}

            <Card size="small" title="📊 Summary">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Statistic
                  title={
                    isManager ? "Total Contributions" : "Your Contributions"
                  }
                  value={isManager ? totalContribution : userTotalContribution}
                  prefix="৳"
                  precision={2}
                  valueStyle={{ color: "#3f8600" }}
                />

                {isManager && (
                  <>
                    <Divider style={{ margin: "12px 0" }} />
                    <Statistic
                      title="Monthly Rent Target"
                      value={rentSummary.totalRent}
                      prefix="৳"
                      precision={0}
                    />
                    <Statistic
                      title="Rent Collected"
                      value={rentSummary.totalPaid}
                      prefix="৳"
                      precision={0}
                      valueStyle={{ color: "#389e0d" }}
                    />
                    <Statistic
                      title="Collection Rate"
                      value={rentSummary.collectionRate}
                      suffix="%"
                      precision={1}
                      valueStyle={{
                        color:
                          rentSummary.collectionRate > 80
                            ? "#389e0d"
                            : rentSummary.collectionRate > 50
                            ? "#faad14"
                            : "#cf1322",
                      }}
                    />
                  </>
                )}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {isManager
                      ? "All Contributions & Payments"
                      : "Your Payments"}
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
                    onChange={setSelectedMemberId}
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

              {!isManager && (
                <Alert
                  message="Personal Payment History"
                  description="This table shows only your personal payment records. You cannot add or edit payments."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Table
                dataSource={filteredDeposits}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: (
                    <Alert
                      message={
                        isManager
                          ? "No payments recorded yet."
                          : "You haven't made any payments yet."
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
                  sorter={(a, b) => a.date.toDate() - b.date.toDate()}
                />
                <Column
                  title="Type"
                  dataIndex="category"
                  key="category"
                  width={150}
                  render={(category: DepositCategory) => {
                    const categoryInfo = DEPOSIT_CATEGORIES.find(
                      (c) => c.value === category
                    );
                    return (
                      <Tag
                        color={categoryInfo?.color || "blue"}
                        icon={categoryInfo?.icon}
                      >
                        {categoryInfo?.label || category}
                      </Tag>
                    );
                  }}
                  filters={DEPOSIT_CATEGORIES.map((cat) => ({
                    text: cat.label,
                    value: cat.value,
                  }))}
                  onFilter={(value, record) => record.category === value}
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
                  sorter={(a, b) => a.amount - b.amount}
                />
                <Column
                  title="Member"
                  dataIndex="userName"
                  key="userName"
                  width={140}
                  render={(name: string, record: any) => (
                    <Tag
                      color={record.userId === user?.uid ? "blue" : "default"}
                      icon={
                        record.userId === user?.uid ? (
                          <EyeOutlined />
                        ) : undefined
                      }
                    >
                      {name} {record.userId === user?.uid && "(You)"}
                    </Tag>
                  )}
                />
                <Column
                  title="Details"
                  dataIndex="description"
                  key="description"
                  ellipsis
                />
                {isManager && (
                  <Column
                    title="Rent Month"
                    dataIndex="rentMonth"
                    key="rentMonth"
                    width={120}
                    render={(month: string) =>
                      month && (
                        <Tag icon={<CalendarOutlined />}>
                          {moment(month).format("MMM YYYY")}
                        </Tag>
                      )
                    }
                  />
                )}
              </Table>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  if (isManager) {
    tabItems.push({
      key: "status",
      label: "📈 Payment Status",
      children: (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <RentStatusTable
                members={members}
                getMemberRentStatus={getMemberRentStatus}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Card title="💰 Rent Collection Overview" size="small">
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="large"
                >
                  <Statistic
                    title="Total Monthly Rent"
                    value={rentSummary.totalRent}
                    prefix="৳"
                    precision={0}
                  />
                  <Statistic
                    title="Collected Amount"
                    value={rentSummary.totalPaid}
                    prefix="৳"
                    precision={0}
                    valueStyle={{ color: "#389e0d" }}
                  />
                  <Statistic
                    title="Remaining Amount"
                    value={rentSummary.totalRemaining}
                    prefix="৳"
                    precision={0}
                    valueStyle={{ color: "#cf1322" }}
                  />
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
                      "0%": "#ff4d4f",
                      "50%": "#faad14",
                      "100%": "#52c41a",
                    }}
                  />
                  <Text type="secondary">
                    Collection Rate: {rentSummary.collectionRate.toFixed(1)}%
                  </Text>
                </Space>
              </Card>
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
        <BankOutlined /> Member Contribution & Bill Management
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginTop: 20 }}
        items={tabItems}
      />
    </Card>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  useBalanceSheetData,
  MemberDetailedData,
} from "../../lib/hooks/useBalanceSheetData";
import { useAuth } from "../../lib/auth-context";
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Tag,
  Select,
  Divider,
  Statistic,
  Table,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  ForkOutlined,
  WalletOutlined,
  MoneyCollectOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import moment from "moment";
import type {
  Deposit as DepositType,
  Expense as ExpenseType,
} from "../../lib/types";

const { Title, Text } = Typography;
const { Option } = Select;

interface BalanceSheetProps {
  messId: string;
}

const DepositDetailsTable: React.FC<{ deposits: DepositType[] }> = ({
  deposits,
}) => (
  <Card
    title={
      <Title level={5} style={{ margin: 0 }}>
        Deposits Received (Credit)
      </Title>
    }
    size="small"
    style={{ marginBottom: 16 }}
  >
    <Table
      dataSource={deposits}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: "No deposits this month." }}
    >
      <Table.Column
        title="Date"
        dataIndex="date"
        render={(date) => moment(date.toDate()).format("MMM DD")}
      />
      <Table.Column
        title="User Name"
        dataIndex="userName"
        render={(name) => <Tag color="blue">{name || "N/A"}</Tag>}
      />
      <Table.Column
        title="Amount (৳)"
        dataIndex="amount"
        align="right"
        render={(amount: number) => (
          <Text type="success">৳{amount.toFixed(2)}</Text>
        )}
      />
    </Table>
  </Card>
);

const GroceryDetailsTable: React.FC<{ expenses: ExpenseType[] }> = ({
  expenses,
}) => (
  <Card
    title={
      <Title level={5} style={{ margin: 0 }}>
        <MoneyCollectOutlined /> Grocery Expenses Paid
      </Title>
    }
    size="small"
    style={{ marginBottom: 16 }}
  >
    <Table
      dataSource={expenses}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: "No grocery expenses paid this month." }}
    >
      <Table.Column
        title="Date"
        dataIndex="date"
        render={(date) => moment(date.toDate()).format("MMM DD")}
      />
      <Table.Column title="Title" dataIndex="title" />
      <Table.Column
        title="Amount (৳)"
        dataIndex="amount"
        align="right"
        render={(amount: number) => (
          <Text type="warning">৳{amount.toFixed(2)}</Text>
        )}
      />
    </Table>
  </Card>
);

const UtilityDetailsTable: React.FC<{ expenses: ExpenseType[] }> = ({
  expenses,
}) => (
  <Card
    title={
      <Title level={5} style={{ margin: 0 }}>
        <HomeOutlined /> Utility/Overhead Paid
      </Title>
    }
    size="small"
    style={{ marginBottom: 16 }}
  >
    <Table
      dataSource={expenses}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      size="small"
      locale={{ emptyText: "No utility expenses paid this month." }}
    >
      <Table.Column
        title="Date"
        dataIndex="date"
        render={(date) => moment(date.toDate()).format("MMM DD")}
      />
      <Table.Column title="Title" dataIndex="title" />
      <Table.Column
        title="Amount (৳)"
        dataIndex="amount"
        align="right"
        render={(amount: number) => (
          <Text type="danger">৳{amount.toFixed(2)}</Text>
        )}
      />
    </Table>
  </Card>
);

export default function BalanceSheet({ messId }: BalanceSheetProps) {
  const { stats, loading } = useBalanceSheetData();
  const { isManager, user } = useAuth();

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    user?.uid || null
  );

  useEffect(() => {
    if (stats && !selectedMemberId && stats.allMembersData.length > 0) {
      const initialMember = stats.allMembersData.find(
        (d) => d.member.uid === user?.uid
      );
      const initialId =
        initialMember?.member.uid || stats.allMembersData[0].member.uid;
      setSelectedMemberId(initialId);
    }
  }, [stats, selectedMemberId, user]);

  if (!isManager) {
    return (
      <Alert
        message="Access Denied"
        description="Only managers can access the member financial summary."
        type="error"
        showIcon
        style={{ margin: "20px 0" }}
      />
    );
  }

  if (loading || !stats) {
    return (
      <Spin tip="Calculating member data..." style={{ margin: "50px 0" }} />
    );
  }

  const selectedMemberData: MemberDetailedData | undefined =
    stats.allMembersData.find((d) => d.member.uid === selectedMemberId);

  return (
    <div className="balance-sheet-container">
      <Title level={2} style={{ margin: 0 }}>
        <TeamOutlined /> <strong>Member Financial Summary</strong>
      </Title>
      <p style={{ marginBottom: 20 }}>
        Select a member to view their detailed financial breakdown for{" "}
        <strong>{stats.currentMonth}</strong>.
      </p>

      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8} lg={6}>
          <Text strong>
            <UserOutlined /> Select Member:
          </Text>
        </Col>
        <Col xs={24} sm={16} lg={18}>
          <Select
            value={selectedMemberId}
            style={{ width: "100%" }}
            placeholder="Select a member to view details"
            onChange={setSelectedMemberId}
            size="large"
          >
            {stats.allMembersData.map((data) => (
              <Option key={data.member.uid} value={data.member.uid}>
                {data.member.displayName}{" "}
                {data.member.role === "manager" && "(Manager)"}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Divider />

      {selectedMemberData ? (
        <Card
          title={
            <Title level={4}>
              {selectedMemberData.member.displayName}'s Monthly Report
              <Tag
                color={
                  selectedMemberData.member.role === "manager" ? "red" : "blue"
                }
                style={{ marginLeft: 10 }}
              >
                {selectedMemberData.member.role.toUpperCase()}
              </Tag>
            </Title>
          }
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
            <Col xs={12} lg={6}>
              <Statistic
                title="Total Meals Consumed"
                value={selectedMemberData.totalMeals}
                suffix={<ForkOutlined />}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="Total Money Paid (Deposit)"
                value={selectedMemberData.totalPaidAmount}
                prefix="৳"
                precision={2}
                valueStyle={{ color: "#389e0d" }}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="Current Global Meal Rate"
                value={stats.globalMealRate}
                prefix="৳"
                precision={2}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="TOTAL MEAL COST (Personal)"
                value={selectedMemberData.totalMealCost}
                prefix="৳"
                precision={2}
                valueStyle={{
                  color: "#cf1322",
                  fontSize: 24,
                }}
              />
            </Col>
          </Row>

          <Divider orientation="left">
            <WalletOutlined /> Transaction Details
          </Divider>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <DepositDetailsTable deposits={selectedMemberData.deposits} />
            </Col>
            <Col xs={24} lg={12}>
              <GroceryDetailsTable
                expenses={selectedMemberData.groceryExpensesPaid}
              />
            </Col>
            {selectedMemberData.member.role === "manager" && (
              <Col xs={24} lg={12}>
                <UtilityDetailsTable
                  expenses={selectedMemberData.utilityExpensesPaid}
                />
              </Col>
            )}
          </Row>
        </Card>
      ) : (
        <Alert
          message="No Member Data Available"
          description="Please select a member from the dropdown, or check if any member data exists for the current month."
          type="info"
          showIcon
        />
      )}
    </div>
  );
}

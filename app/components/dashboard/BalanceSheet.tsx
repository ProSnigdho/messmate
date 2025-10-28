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
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import moment from "moment";
import type {
  Deposit as DepositType,
  Expense as ExpenseType,
} from "../../lib/types";

const { Title, Text } = Typography;
const { Option } = Select;

const PRIMARY_COLOR = "#00695C";
const LIGHT_PRIMARY_COLOR = "#e0f2f1";
const SUCCESS_COLOR = "#389e0d";
const ERROR_COLOR = "#cf1322";

interface BalanceSheetProps {
  messId: string;
}

const CustomTableCard: React.FC<
  React.PropsWithChildren<{ title: React.ReactNode; icon: React.ReactNode }>
> = ({ title, icon, children }) => (
  <Card
    title={
      <Title level={5} style={{ margin: 0, color: PRIMARY_COLOR }}>
        <span style={{ marginRight: 8, color: PRIMARY_COLOR }}>{icon}</span>
        {title}
      </Title>
    }
    size="small"
    className="shadow-md"
    style={{
      marginBottom: 16,
      borderRadius: "8px",
      borderLeft: `3px solid ${PRIMARY_COLOR}`,
    }}
  >
    {children}
  </Card>
);

const DepositDetailsTable: React.FC<{ deposits: DepositType[] }> = ({
  deposits,
}) => (
  <CustomTableCard title="Deposits Received (Credit)" icon={<WalletOutlined />}>
    <Table
      dataSource={deposits}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      size="middle"
      locale={{ emptyText: "No deposits this month." }}
      scroll={{ x: 450 }}
    >
      <Table.Column
        title="Date"
        dataIndex="date"
        render={(date) => moment(date.toDate()).format("MMM DD")}
        width={100}
      />
      <Table.Column
        title="Type"
        dataIndex="category"
        render={(category) => <Tag color={PRIMARY_COLOR}>{category}</Tag>}
        width={120}
      />
      <Table.Column
        title="User Name"
        dataIndex="userName"
        render={(name) => <Tag color={PRIMARY_COLOR}>{name || "N/A"}</Tag>}
        width={120}
      />
      <Table.Column
        title="Amount (৳)"
        dataIndex="amount"
        align="right"
        render={(amount: number) => (
          <Text strong style={{ color: SUCCESS_COLOR }}>
            ৳{amount.toFixed(2)}
          </Text>
        )}
        width={100}
      />
    </Table>
  </CustomTableCard>
);

const GroceryDetailsTable: React.FC<{ expenses: ExpenseType[] }> = ({
  expenses,
}) => (
  <CustomTableCard
    title="Grocery Expenses Paid"
    icon={<MoneyCollectOutlined />}
  >
    <Table
      dataSource={expenses}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      size="middle"
      locale={{ emptyText: "No grocery expenses paid this month." }}
      scroll={{ x: 450 }}
    >
      <Table.Column
        title="Date"
        dataIndex="date"
        render={(date) => moment(date.toDate()).format("MMM DD")}
        width={100}
      />
      <Table.Column title="Title" dataIndex="title" width={150} />
      <Table.Column
        title="Amount (৳)"
        dataIndex="amount"
        align="right"
        render={(amount: number) => (
          <Text strong style={{ color: ERROR_COLOR }}>
            ৳{amount.toFixed(2)}
          </Text>
        )}
        width={100}
      />
    </Table>
  </CustomTableCard>
);

const UtilityDetailsTable: React.FC<{ expenses: ExpenseType[] }> = ({
  expenses,
}) => (
  <CustomTableCard title="Utility Expenses Paid" icon={<HomeOutlined />}>
    <Table
      dataSource={expenses}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      size="middle"
      locale={{ emptyText: "No utility expenses paid this month." }}
      scroll={{ x: 450 }}
    >
      <Table.Column
        title="Date"
        dataIndex="date"
        render={(date) => moment(date.toDate()).format("MMM DD")}
        width={100}
      />
      <Table.Column title="Title" dataIndex="title" width={150} />
      <Table.Column
        title="Amount (৳)"
        dataIndex="amount"
        align="right"
        render={(amount: number) => (
          <Text strong style={{ color: ERROR_COLOR }}>
            ৳{amount.toFixed(2)}
          </Text>
        )}
        width={100}
      />
    </Table>
  </CustomTableCard>
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
      <Row justify="center" style={{ minHeight: "80vh", alignItems: "center" }}>
        <Spin tip="Calculating member data..." size="large" />
      </Row>
    );
  }

  const selectedMemberData: MemberDetailedData | undefined =
    stats.allMembersData.find((d) => d.member.uid === selectedMemberId);

  const baseFontSize = "1.1rem";
  const headerFontSize = "2.5rem";

  return (
    <div className="balance-sheet-container" style={{ padding: "0 16px" }}>
      <Title
        level={2}
        style={{ margin: 0, fontSize: headerFontSize, color: PRIMARY_COLOR }}
      >
        <TeamOutlined />{" "}
        <strong style={{ fontWeight: "800" }}>Member Financial Summary</strong>
      </Title>
      <p style={{ marginBottom: 20, fontSize: baseFontSize }}>
        Select a member to view their detailed financial breakdown for{" "}
        <Text strong style={{ color: PRIMARY_COLOR }}>
          {stats.currentMonth}
        </Text>
        .
      </p>

      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8} lg={6}>
          <Text strong style={{ fontSize: baseFontSize }}>
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
                <span style={{ fontSize: "1rem" }}>
                  {data.member.displayName}{" "}
                  {data.member.role === "manager" && (
                    <Tag color="red">(Manager)</Tag>
                  )}
                  {data.member.role === "pending" && (
                    <Tag color="orange">(Pending)</Tag>
                  )}
                </span>
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Divider />

      {selectedMemberData ? (
        <Card
          className="shadow-xl"
          style={{
            borderRadius: "12px",
            borderTop: `5px solid ${PRIMARY_COLOR}`,
          }}
          title={
            <Title
              level={4}
              style={{ margin: 0, color: PRIMARY_COLOR, fontSize: "1.5rem" }}
            >
              <FileTextOutlined style={{ marginRight: 8 }} />
              {selectedMemberData.member.displayName}'s Monthly Report
              <Tag
                color={
                  selectedMemberData.member.role === "manager"
                    ? "red"
                    : selectedMemberData.member.role === "pending"
                    ? "orange"
                    : PRIMARY_COLOR
                }
                style={{ marginLeft: 10, fontSize: "1rem", padding: "4px 8px" }}
              >
                {selectedMemberData.member.role.toUpperCase()}
              </Tag>
            </Title>
          }
          styles={{
            body: { padding: 30 },
          }}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
            <Col xs={12} lg={6}>
              <Statistic
                title="Total Meals Consumed"
                value={selectedMemberData.totalMeals}
                suffix={<ForkOutlined />}
                valueStyle={{ fontSize: 32, color: PRIMARY_COLOR }}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="Total Deposits (Credit)"
                value={selectedMemberData.totalPaidAmount}
                prefix="৳"
                precision={2}
                valueStyle={{ fontSize: 32, color: SUCCESS_COLOR }}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="Current Meal Rate"
                value={stats.globalMealRate}
                prefix="৳"
                precision={2}
                valueStyle={{ fontSize: 32, color: "#fa8c16" }}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="Utility Share"
                value={selectedMemberData.utilityShare}
                prefix="৳"
                precision={2}
                valueStyle={{ fontSize: 32, color: "#722ed1" }}
              />
            </Col>
          </Row>

          <Divider dashed />

          <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
            <Col xs={12} lg={6}>
              <Statistic
                title="Actual Meal Cost"
                value={selectedMemberData.totalMealCost}
                prefix="৳"
                precision={2}
                valueStyle={{ fontSize: 32, color: ERROR_COLOR }}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="Total Paid (Grocery)"
                value={selectedMemberData.monthlyTotalPaid}
                prefix="৳"
                precision={2}
                valueStyle={{ fontSize: 32, color: SUCCESS_COLOR }}
              />
            </Col>
            <Col xs={12} lg={6}>
              <Statistic
                title="Total Debit (Cost)"
                value={
                  selectedMemberData.totalMealCost +
                  selectedMemberData.utilityShare
                }
                prefix="৳"
                precision={2}
                valueStyle={{ fontSize: 32, color: ERROR_COLOR }}
              />
            </Col>

            <Col xs={12} lg={6}>
              <Card
                styles={{
                  body: { padding: "8px 4px" },
                }}
                style={{
                  backgroundColor:
                    selectedMemberData.finalBalance >= 0
                      ? LIGHT_PRIMARY_COLOR
                      : "#fff1f0",
                  border: `2px solid ${
                    selectedMemberData.finalBalance >= 0
                      ? SUCCESS_COLOR
                      : ERROR_COLOR
                  }`,
                }}
              >
                <Statistic
                  title="FINAL BALANCE (Settlement)"
                  value={selectedMemberData.finalBalance}
                  prefix="৳"
                  precision={2}
                  valueStyle={{
                    color:
                      selectedMemberData.finalBalance >= 0
                        ? SUCCESS_COLOR
                        : ERROR_COLOR,
                    fontWeight: "bold",
                    fontSize: 20,
                  }}
                />
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  {selectedMemberData.finalBalance >= 0 ? (
                    <ArrowUpOutlined
                      style={{ color: SUCCESS_COLOR, fontSize: 18 }}
                    />
                  ) : (
                    <ArrowDownOutlined
                      style={{ color: ERROR_COLOR, fontSize: 18 }}
                    />
                  )}
                </div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "10px",
                    textAlign: "center",
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {selectedMemberData.finalBalance >= 0 ? "RECEIVE" : "PAY"}
                </Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
            <Col span={24}>
              <Card
                size="small"
                style={{
                  backgroundColor: LIGHT_PRIMARY_COLOR,
                  borderLeft: `5px solid ${PRIMARY_COLOR}`,
                }}
              >
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  {" "}
                  {selectedMemberData.finalBalance > 0.01 ? (
                    <Tag
                      color={SUCCESS_COLOR}
                      style={{
                        fontSize: 16,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontWeight: "bold",
                      }}
                    >
                      📥 {selectedMemberData.member.displayName} will receive: ৳
                      {Math.abs(selectedMemberData.finalBalance).toFixed(2)}
                    </Tag>
                  ) : selectedMemberData.finalBalance < -0.01 ? (
                    <Tag
                      color={ERROR_COLOR}
                      style={{
                        fontSize: 16,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontWeight: "bold",
                      }}
                    >
                      📤 {selectedMemberData.member.displayName} needs to pay: ৳
                      {Math.abs(selectedMemberData.finalBalance).toFixed(2)}
                    </Tag>
                  ) : (
                    <Tag
                      color={PRIMARY_COLOR}
                      style={{
                        fontSize: 16,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontWeight: "bold",
                      }}
                    >
                      ✅ Perfectly Settled (0.00 ৳)
                    </Tag>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          <Divider
            orientation="left"
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: PRIMARY_COLOR,
            }}
          >
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

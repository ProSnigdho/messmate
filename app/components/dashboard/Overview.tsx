"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Spin,
  Alert,
  Tag,
  Divider,
  Table,
  Badge,
  Button,
  Modal,
  List,
} from "antd";
import {
  UserOutlined,
  FireOutlined,
  DollarCircleOutlined,
  SwapOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CalculatorOutlined,
  BankOutlined,
  ShoppingOutlined,
  TeamOutlined,
  BellOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  useOverviewData,
  OverviewStats,
} from "../../lib/hooks/useOverviewData";
import { useNotices, Notice } from "../../lib/hooks/useNotices";
import { useAuth } from "../../lib/auth-context";
import moment from "moment";

const { Title, Text } = Typography;
const { Column } = Table;

interface MemberChartData {
  name: string;
  Balance: number;
  Credit: number;
  Debit: number;
  GroceryPaid: number;
}

const useNoticeReadStatus = () => {
  const { user } = useAuth();
  const [readNotices, setReadNotices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.uid) return;

    const key = `overviewReadNotices_${user.uid}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setReadNotices(new Set(JSON.parse(saved)));
    }
  }, [user?.uid]);

  const markAsRead = (noticeId: string) => {
    if (!user?.uid) return;

    const newReadNotices = new Set([...readNotices, noticeId]);
    setReadNotices(newReadNotices);

    const key = `overviewReadNotices_${user.uid}`;
    localStorage.setItem(key, JSON.stringify([...newReadNotices]));
  };

  const markAllAsRead = (allNoticeIds: string[]) => {
    if (!user?.uid) return;

    const newReadNotices = new Set([...readNotices, ...allNoticeIds]);
    setReadNotices(newReadNotices);

    const key = `overviewReadNotices_${user.uid}`;
    localStorage.setItem(key, JSON.stringify([...newReadNotices]));
  };

  const isNoticeRead = (noticeId: string) => readNotices.has(noticeId);

  const getUnreadCount = (allNoticeIds: string[]) => {
    return allNoticeIds.filter((id) => !isNoticeRead(id)).length;
  };

  return { markAsRead, markAllAsRead, isNoticeRead, getUnreadCount };
};

const MemberBalanceChart: React.FC<{
  stats: OverviewStats;
  currentUserId: string | null;
}> = ({ stats, currentUserId }) => {
  const chartData: MemberChartData[] = stats.members
    .map((member) => {
      const balance = stats.memberBalances[member.uid] || 0;
      const credit = stats.memberCredits[member.uid] || 0;
      const debit = stats.memberDebits[member.uid] || 0;
      const groceryPaid = stats.memberGroceryPaid[member.uid] || 0;

      return {
        name:
          member.displayName + (member.uid === currentUserId ? " (You)" : ""),
        Balance: balance,
        Credit: credit,
        Debit: debit,
        GroceryPaid: groceryPaid,
      };
    })
    .sort((a, b) => b.Balance - a.Balance);

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          📊 Members Financial Overview
        </Title>
      }
      style={{ height: "100%" }}
    >
      <div style={{ width: "100%", overflow: "auto" }}>
        <BarChart
          width={800}
          height={400}
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis tickFormatter={(value: number) => `৳${value.toFixed(0)}`} />
          <Tooltip
            formatter={(value: number, name: string) => [
              `৳${value.toFixed(2)}`,
              name,
            ]}
            labelFormatter={(label: string) => label.split(" (You)")[0]}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />

          <Bar dataKey="GroceryPaid" name="Grocery Paid (৳)" fill="#faad14" />
          <Bar dataKey="Credit" name="Total Credit (৳)" fill="#52c41a" />
          <Bar dataKey="Debit" name="Total Debit (৳)" fill="#f5222d" />
          <Bar dataKey="Balance" name="Net Balance (৳)" fill="#1890ff" />
        </BarChart>
      </div>
    </Card>
  );
};

const MemberDetailsTable: React.FC<{
  stats: OverviewStats;
  currentUserId: string | null;
}> = ({ stats, currentUserId }) => {
  const tableData = stats.members.map((member) => {
    const mealsTaken = stats.memberMealCounts[member.uid] || 0;
    const credit = stats.memberCredits[member.uid] || 0;
    const debit = stats.memberDebits[member.uid] || 0;
    const balance = stats.memberBalances[member.uid] || 0;
    const groceryPaid = stats.memberGroceryPaid[member.uid] || 0;
    const mealCost = mealsTaken * stats.mealRate;
    const utilityShare = stats.utilityCostPerMember;

    return {
      key: member.uid,
      name: member.displayName + (member.uid === currentUserId ? " (You)" : ""),
      mealsTaken,
      mealCost: parseFloat(mealCost.toFixed(2)),
      utilityShare: parseFloat(utilityShare.toFixed(2)),
      totalDebit: parseFloat(debit.toFixed(2)),
      totalCredit: parseFloat(credit.toFixed(2)),
      groceryPaid: parseFloat(groceryPaid.toFixed(2)),
      netBalance: parseFloat(balance.toFixed(2)),
    };
  });

  return (
    <Card title="📋 Member Financial Details" style={{ marginTop: 16 }}>
      <Table
        dataSource={tableData}
        pagination={false}
        scroll={{ x: 900 }}
        size="small"
      >
        <Column
          title="Member"
          dataIndex="name"
          key="name"
          fixed="left"
          width={120}
        />
        <Column
          title="Meals Taken"
          dataIndex="mealsTaken"
          key="mealsTaken"
          align="center"
          width={100}
        />
        <Column
          title="Meal Cost (৳)"
          dataIndex="mealCost"
          key="mealCost"
          align="right"
          render={(value) => `৳${value}`}
          width={100}
        />
        <Column
          title="Utility Share (৳)"
          dataIndex="utilityShare"
          key="utilityShare"
          align="right"
          render={(value) => `৳${value}`}
          width={100}
        />
        <Column
          title="Grocery Paid (৳)"
          dataIndex="groceryPaid"
          key="groceryPaid"
          align="right"
          render={(value) => (
            <Text strong style={{ color: "#faad14" }}>
              ৳{value}
            </Text>
          )}
          width={100}
        />
        <Column
          title="Total Credit (৳)"
          dataIndex="totalCredit"
          key="totalCredit"
          align="right"
          render={(value) => (
            <Text strong style={{ color: "#389e0d" }}>
              ৳{value}
            </Text>
          )}
          width={100}
        />
        <Column
          title="Total Debit (৳)"
          dataIndex="totalDebit"
          key="totalDebit"
          align="right"
          render={(value) => (
            <Text strong style={{ color: "#cf1322" }}>
              ৳{value}
            </Text>
          )}
          width={100}
        />
        <Column
          title="Net Balance (৳)"
          dataIndex="netBalance"
          key="netBalance"
          align="right"
          fixed="right"
          render={(value) => (
            <Text
              strong
              style={{
                color: value >= 0 ? "#389e0d" : "#cf1322",
                fontSize: "14px",
              }}
            >
              ৳{value}
            </Text>
          )}
          width={120}
        />
      </Table>
    </Card>
  );
};

const NoticesPopup: React.FC<{
  visible: boolean;
  onClose: () => void;
  notices: Notice[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
}> = ({ visible, onClose, notices, unreadCount, onMarkAllAsRead }) => {
  const { markAsRead } = useNoticeReadStatus();

  const handleNoticeClick = (notice: Notice) => {
    markAsRead(notice.id);
  };

  const getTimeDisplay = (date: any) => {
    const noticeDate = moment(date.toDate());
    const now = moment();

    if (now.diff(noticeDate, "hours") < 24) {
      return noticeDate.fromNow();
    } else {
      return noticeDate.format("MMM DD, h:mm A");
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BellOutlined style={{ color: "#1890ff" }} />
          <Text strong style={{ margin: 0, fontSize: "18px" }}>
            Latest Notices
          </Text>
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ marginLeft: 8 }} />
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        unreadCount > 0 && (
          <Button key="markAll" type="link" onClick={onMarkAllAsRead}>
            Mark all as read
          </Button>
        ),
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ].filter(Boolean)}
      width={600}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: "60vh", overflow: "auto" }}>
        {notices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <BellOutlined
              style={{ fontSize: "48px", color: "#d9d9d9", marginBottom: 16 }}
            />
            <Title level={4} style={{ color: "#d9d9d9" }}>
              No Notices
            </Title>
            <Text type="secondary">No announcements posted yet.</Text>
          </div>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={notices}
            renderItem={(item: Notice) => (
              <List.Item
                onClick={() => handleNoticeClick(item)}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                  cursor: "pointer",
                }}
              >
                <List.Item.Meta
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Text strong style={{ fontSize: "16px" }}>
                        {item.title}
                      </Text>
                      <Tag color="geekblue">{getTimeDisplay(item.date)}</Tag>
                    </div>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Posted by: <strong>{item.authorName}</strong>
                    </Text>
                  }
                />
                <div style={{ marginTop: 8 }}>
                  <Text>{item.content}</Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};

interface OverviewProps {
  messId: string;
  userRole: "manager" | "member";
}

export default function Overview({ messId, userRole }: OverviewProps) {
  const {
    stats: fetchedStats,
    loading,
    messId: currentMessId,
    currentUserId,
  } = useOverviewData();

  const { notices, loading: noticesLoading } = useNotices();
  const { markAllAsRead, getUnreadCount } = useNoticeReadStatus();
  const [noticesPopupVisible, setNoticesPopupVisible] = useState(false);

  const isManager = userRole === "manager";
  const stats = fetchedStats;
  const currentUserBalance = stats?.memberBalances?.[currentUserId || ""] || 0;
  const userIdForChart = currentUserId || null;

  const allNoticeIds = notices.map((notice) => notice.id);
  const unreadCount = getUnreadCount(allNoticeIds);

  const handleBellClick = () => {
    setNoticesPopupVisible(true);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead(allNoticeIds);
  };

  const handleClosePopup = () => {
    setNoticesPopupVisible(false);
  };

  if (loading || !stats) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          Loading monthly stats for {stats?.currentMonth || "this month"}...
        </Text>
      </div>
    );
  }

  if (!currentMessId) {
    return (
      <Alert
        message="Mess ID not found. Please join or create a mess."
        type="error"
      />
    );
  }

  const totalMembers = stats.members.length;
  const totalMonthlyMeals = stats.totalMeals;
  const totalGroceryCost = stats.totalGroceryCost;
  const currentMealRate = stats.mealRate;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Title level={2} style={{ color: "#004d40", margin: 0 }}>
            🏠 Mess Financial Overview
            <Text type="secondary" style={{ fontSize: 16, marginLeft: 10 }}>
              ({stats.currentMonth})
            </Text>
          </Title>
          <Tag
            color={isManager ? "red" : "blue"}
            style={{ fontSize: "14px", padding: "4px 12px" }}
          >
            {isManager ? "👑 Manager View" : "👤 Member View"}
          </Tag>
        </div>

        <Badge count={unreadCount} size="small" offset={[-5, 5]}>
          <Button
            type="text"
            icon={
              <BellOutlined
                style={{
                  fontSize: "24px",
                  color: unreadCount > 0 ? "#1890ff" : "#666",
                }}
              />
            }
            onClick={handleBellClick}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border:
                unreadCount > 0 ? "2px solid #1890ff" : "2px solid #d9d9d9",
              background: unreadCount > 0 ? "#f0f8ff" : "#fafafa",
            }}
          />
        </Badge>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Members"
              value={totalMembers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#004d40" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Meals"
              value={totalMonthlyMeals}
              prefix={<FireOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Food Expenses"
              value={totalGroceryCost}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#cf1322" }}
              suffix={<ShoppingOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Meal Rate"
              value={currentMealRate}
              prefix="৳"
              precision={2}
              valueStyle={{
                color: "#389e0d",
              }}
              suffix={<CalculatorOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Deposits"
              value={stats.totalDeposits}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#389e0d" }}
              suffix={<BankOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Utility Expenses"
              value={stats.totalUtilityCost}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#faad14" }}
              suffix={<SwapOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Utility Per Member"
              value={stats.utilityCostPerMember}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#722ed1" }}
              suffix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Financial Analysis</Divider>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <MemberBalanceChart stats={stats} currentUserId={userIdForChart} />
        </Col>
      </Row>

      {isManager && (
        <MemberDetailsTable stats={stats} currentUserId={userIdForChart} />
      )}

      {!isManager && (
        <Card title="📊 Your Financial Summary" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Your Meals"
                value={stats.memberMealCounts[currentUserId || ""] || 0}
                prefix={<FireOutlined />}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Your Deposits"
                value={stats.memberCredits[currentUserId || ""] || 0}
                prefix="৳"
                valueStyle={{ color: "#389e0d" }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Your Meal Cost"
                value={
                  (stats.memberMealCounts[currentUserId || ""] || 0) *
                  stats.mealRate
                }
                prefix="৳"
                precision={0}
                valueStyle={{ color: "#cf1322" }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Your Utility Share"
                value={stats.utilityCostPerMember}
                prefix="৳"
                precision={0}
                valueStyle={{ color: "#faad14" }}
              />
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0" }} />
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <Text
              strong
              style={{ fontSize: "16px", display: "block", marginBottom: 4 }}
            >
              Your Net Balance
            </Text>
            <Text
              strong
              style={{
                fontSize: "20px",
                color: currentUserBalance >= 0 ? "#389e0d" : "#cf1322",
              }}
            >
              ৳{currentUserBalance.toFixed(2)}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: "12px", display: "block", marginTop: 4 }}
            >
              {currentUserBalance >= 0
                ? "You will receive this amount"
                : "You need to pay this amount"}
            </Text>
          </div>
        </Card>
      )}

      <NoticesPopup
        visible={noticesPopupVisible}
        onClose={handleClosePopup}
        notices={notices}
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  );
}

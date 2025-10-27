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
  CalculatorOutlined,
  BankOutlined,
  ShoppingOutlined,
  TeamOutlined,
  BellOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
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
  FinalBalance: number;
  GroceryPaid: number;
  MealCost: number;
  colorIndex: number;
}

interface MemberDetailRow {
  key: string;
  name: string;
  mealsTaken: number;
  mealCost: number;
  groceryPaid: number;
  finalBalance: number;
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

const CHART_COLORS = {
  GroceryPaid: "#FFD666",
  MealCost: "#FF7875",
  FinalBalance: "#40A9FF",
};

const MemberBalanceChart: React.FC<{
  stats: OverviewStats;
  currentUserId: string | null;
}> = ({ stats, currentUserId }) => {
  const chartData: MemberChartData[] = stats.members.map((member, idx) => {
    const finalBalance = stats.memberFinalBalances[member.uid] || 0;
    const groceryPaid = stats.memberGroceryPaid[member.uid] || 0;
    const mealCost = (stats.memberMealCounts[member.uid] || 0) * stats.mealRate;

    return {
      name: member.displayName + (member.uid === currentUserId ? " (You)" : ""),
      FinalBalance: finalBalance,
      GroceryPaid: groceryPaid,
      MealCost: mealCost,
      colorIndex: idx % 8,
    };
  });

  return (
    <Card title="📊 Member Financial Comparison">
      <div
        style={{ width: "100%", height: 400, minWidth: 0, overflowX: "auto" }}
      >
        <BarChart
          width={Math.max(stats.members.length * 150, 600)} // Dynamic width based on member count, min 600
          height={400}
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-30}
            textAnchor="end"
            interval={0}
            height={120}
          />
          <YAxis tickFormatter={(value) => `৳${value}`} />
          <Tooltip
            formatter={(value: number) => `৳${value.toFixed(2)}`}
            labelFormatter={(label: string) => label.split(" (You)")[0]}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} />

          <Bar
            dataKey="GroceryPaid"
            name="Grocery Paid (৳)"
            fill={CHART_COLORS.GroceryPaid}
          />

          <Bar
            dataKey="MealCost"
            name="Meal Cost (৳)"
            fill={CHART_COLORS.MealCost}
          />

          <Bar
            dataKey="FinalBalance"
            name="Final Balance (৳)"
            fill={CHART_COLORS.FinalBalance}
          />
        </BarChart>
      </div>
    </Card>
  );
};

const MemberDetailsTable: React.FC<{
  tableData: MemberDetailRow[];
}> = ({ tableData }) => {
  return (
    <Card title="📋 Member Financial Details" style={{ marginTop: 16 }}>
      <div style={{ width: "100%", overflowX: "auto" }}>
        <Table
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
        >
          <Column
            title="Member"
            dataIndex="name"
            key="name"
            fixed="left"
            width={100}
            render={(name) => (
              <Text strong style={{ fontSize: 12 }}>
                {name}
              </Text>
            )}
          />
          <Column
            title="Meals"
            dataIndex="mealsTaken"
            key="mealsTaken"
            align="center"
            width={70}
            render={(value) => <Text style={{ fontSize: 12 }}>{value}</Text>}
          />
          <Column
            title="Meal Cost"
            dataIndex="mealCost"
            key="mealCost"
            align="right"
            width={80}
            render={(value) => <Text style={{ fontSize: 11 }}>৳{value}</Text>}
          />
          <Column
            title="Grocery Paid"
            dataIndex="groceryPaid"
            key="groceryPaid"
            align="right"
            width={80}
            render={(value) => (
              <Text
                strong
                style={{ color: CHART_COLORS.GroceryPaid, fontSize: 11 }}
              >
                ৳{value}
              </Text>
            )}
          />
          <Column
            title="Final Balance"
            dataIndex="finalBalance"
            key="finalBalance"
            align="right"
            fixed="right"
            width={90}
            render={(value) => (
              <Text
                strong
                style={{
                  color: value >= 0 ? "#73D13D" : "#FF4D4F",
                  fontSize: 12,
                }}
              >
                ৳{value}
              </Text>
            )}
          />
        </Table>
      </div>
    </Card>
  );
};

const MemberDetailsList: React.FC<{
  tableData: MemberDetailRow[];
}> = ({ tableData }) => {
  return (
    <Card title="📋 Member Financial Details" style={{ marginTop: 16 }}>
      <List
        dataSource={tableData}
        renderItem={(item) => (
          <Card
            size="small"
            style={{
              marginBottom: 12,
              borderLeft:
                item.finalBalance >= 0
                  ? "4px solid #73D13D"
                  : "4px solid #FF4D4F",
            }}
          >
            <List.Item style={{ padding: 0 }}>
              <List.Item.Meta
                avatar={<UserOutlined style={{ fontSize: 20 }} />}
                title={<Text strong>{item.name}</Text>}
                description={`Meals: ${item.mealsTaken}`}
              />
              <div style={{ textAlign: "right" }}>
                <Text
                  strong
                  style={{
                    color: item.finalBalance >= 0 ? "#73D13D" : "#FF4D4F",
                    fontSize: 16,
                  }}
                >
                  ৳{item.finalBalance.toFixed(2)}
                </Text>
              </div>
            </List.Item>
            <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
              <Col xs={8}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Meal Cost:
                </Text>
                <br />
                <Text style={{ color: CHART_COLORS.MealCost, fontSize: 12 }}>
                  ৳{item.mealCost.toFixed(2)}
                </Text>
              </Col>
              <Col xs={8}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Grocery Paid:
                </Text>
                <br />
                <Text style={{ color: CHART_COLORS.GroceryPaid, fontSize: 12 }}>
                  ৳{item.groceryPaid.toFixed(2)}
                </Text>
              </Col>
              <Col xs={8}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Status:
                </Text>
                <br />
                <Text
                  style={{
                    color: item.finalBalance >= 0 ? "#73D13D" : "#FF4D4F",
                    fontSize: 12,
                  }}
                >
                  {item.finalBalance >= 0 ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )}
                  {item.finalBalance >= 0 ? " Receivable" : " Payable"}
                </Text>
              </Col>
            </Row>
          </Card>
        )}
      />
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
          <Text strong style={{ margin: 0, fontSize: 18 }}>
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
              style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
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
                      <Text strong style={{ fontSize: 16 }}>
                        {item.title}
                      </Text>
                      <Tag color="geekblue">{getTimeDisplay(item.date)}</Tag>
                    </div>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
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
  userRole: "manager" | "member" | "pending";
}

export default function Overview({ messId, userRole }: OverviewProps) {
  const {
    stats: fetchedStats,
    loading,
    messId: currentMessId,
    currentUserId,
  } = useOverviewData();
  const { notices } = useNotices();
  const { markAllAsRead, getUnreadCount } = useNoticeReadStatus();
  const [noticesPopupVisible, setNoticesPopupVisible] = useState(false);

  const isManager = userRole === "manager";
  const stats = fetchedStats;
  const currentUserFinalBalance =
    stats?.memberFinalBalances?.[currentUserId || ""] || 0;

  const allNoticeIds = notices.map((notice) => notice.id);
  const unreadCount = getUnreadCount(allNoticeIds);

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

  const memberTableData: MemberDetailRow[] = stats.members.map((member) => {
    const mealsTaken = stats.memberMealCounts[member.uid] || 0;
    const groceryPaid = stats.memberGroceryPaid[member.uid] || 0;
    const mealCost = mealsTaken * stats.mealRate;
    const finalBalance = stats.memberFinalBalances[member.uid] || 0;

    return {
      key: member.uid,
      name: member.displayName + (member.uid === currentUserId ? " (You)" : ""),
      mealsTaken,
      mealCost: parseFloat(mealCost.toFixed(2)),
      groceryPaid: parseFloat(groceryPaid.toFixed(2)),
      finalBalance: parseFloat(finalBalance.toFixed(2)),
    };
  });

  return (
    <div style={{ position: "relative" }}>
      {" "}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 16,
            marginRight: 60,
          }}
        >
          <Title
            level={2}
            style={{
              color: "#004d40",
              margin: 0,
              fontSize: "clamp(20px, 5vw, 32px)",
            }}
          >
            🏠 Mess Financial Overview
            <Text type="secondary" style={{ fontSize: 16, marginLeft: 10 }}>
              ({stats.currentMonth})
            </Text>
          </Title>
          <Tag
            color={isManager ? "red" : "blue"}
            style={{ fontSize: 14, padding: "4px 12px" }}
          >
            {isManager ? "👑 Manager View" : "👤 Member View"}
          </Tag>
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
          }}
        >
          <Badge count={unreadCount} size="small" offset={[-5, 5]}>
            <Button
              type="text"
              icon={
                <BellOutlined
                  style={{
                    fontSize: 24,
                    color: unreadCount > 0 ? "#1890ff" : "#666",
                  }}
                />
              }
              onClick={() => setNoticesPopupVisible(true)}
              style={{
                width: 48,
                height: 48,
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
              valueStyle={{ color: "#389e0d" }}
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
        <Col xs={24} style={{ minWidth: 0 }}>
          <MemberBalanceChart
            stats={stats}
            currentUserId={currentUserId || null}
          />
        </Col>
      </Row>
      {isManager && (
        <Row gutter={[24, 24]}>
          <Col xs={0} sm={0} md={24}>
            <MemberDetailsTable tableData={memberTableData} />
          </Col>

          <Col xs={24} sm={24} md={0}>
            <MemberDetailsList tableData={memberTableData} />
          </Col>
        </Row>
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
                title="Your Grocery Paid"
                value={stats.memberGroceryPaid[currentUserId || ""] || 0}
                prefix="৳"
                valueStyle={{ color: CHART_COLORS.GroceryPaid }}
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
                valueStyle={{ color: CHART_COLORS.MealCost }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Your Utility Share"
                value={stats.utilityCostPerMember}
                prefix="৳"
                precision={0}
                valueStyle={{ color: "#722ed1" }}
              />
            </Col>
          </Row>
          <Divider style={{ margin: "16px 0" }} />
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <Text
              strong
              style={{ fontSize: 16, display: "block", marginBottom: 4 }}
            >
              Your Final Balance (Settlement)
            </Text>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {currentUserFinalBalance >= 0 ? (
                <ArrowUpOutlined style={{ color: "#73D13D", fontSize: 20 }} />
              ) : (
                <ArrowDownOutlined style={{ color: "#FF4D4F", fontSize: 20 }} />
              )}
              <Text
                strong
                style={{
                  fontSize: 24,
                  color: currentUserFinalBalance >= 0 ? "#73D13D" : "#FF4D4F",
                }}
              >
                ৳{Math.abs(currentUserFinalBalance).toFixed(2)}
              </Text>
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginTop: 4 }}
            >
              {currentUserFinalBalance >= 0
                ? "You will receive this amount"
                : "You need to pay this amount"}
            </Text>
          </div>
        </Card>
      )}
      <NoticesPopup
        visible={noticesPopupVisible}
        onClose={() => setNoticesPopupVisible(false)}
        notices={notices}
        unreadCount={unreadCount}
        onMarkAllAsRead={() => markAllAsRead(allNoticeIds)}
      />
    </div>
  );
}

"use client";

import React from "react";
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
} from "antd";
import {
  UserOutlined,
  FireOutlined,
  DollarCircleOutlined,
  SwapOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  useOverviewData,
  OverviewStats,
} from "../../lib/hooks/useOverviewData";

const { Title, Text } = Typography;

// --- Chart Component Interfaces ---
interface MemberChartData {
  name: string;
  Balance: number;
  Paid: number;
  Cost: number;
}

// --- Chart Component ---
const MemberBalanceChart: React.FC<{
  stats: OverviewStats;
  currentUserId: string | null;
}> = ({ stats, currentUserId }) => {
  const chartData: MemberChartData[] = stats.members
    .map((member) => {
      const balance = stats.memberBalances[member.uid] || 0;
      return {
        name:
          member.displayName + (member.uid === currentUserId ? " (You)" : ""),
        Balance: balance,
        Paid: 0,
        Cost: 0,
      };
    })
    .sort((a, b) => b.Balance - a.Balance);

  // 🎨 Each member gets a different color (cycled if many members)
  const colors = [
    "#1890ff",
    "#52c41a",
    "#f5222d",
    "#faad14",
    "#722ed1",
    "#13c2c2",
    "#eb2f96",
    "#a0d911",
    "#2f54eb",
    "#fa541c",
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          📊 Members Net Balance Comparison
        </Title>
      }
      variant="borderless"
      style={{ height: "100%" }}
    >
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
              // @ts-ignore
              labelFormatter={(label: string) => label.split(" (You)")[0]}
            />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            {/* ✅ Individual colors per member */}
            <Bar dataKey="Balance" name="Net Balance (৳)">
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// --- Main Overview Component ---
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

  const isManager = userRole === "manager";
  const stats = fetchedStats as OverviewStats | null;
  const currentUserBalance = stats?.memberBalances?.[currentUserId || ""] || 0;
  const userIdForChart = currentUserId || null;

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
  const totalMealCost = stats.totalMealCostForRate;
  const currentMealRate = stats.mealRate;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 30,
        }}
      >
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

      <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
        {/* 1. Total Members */}
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

        {/* 2. Total Monthly Meals */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Meals (Month)"
              value={totalMonthlyMeals}
              prefix={<FireOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        {/* 3. Total Meal Cost */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Meal Cost (Food)"
              value={totalMealCost}
              prefix="৳"
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              suffix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>

        {/* 4. Meal Rate or User Balance */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={isManager ? "Current Meal Rate" : "Your Net Balance"}
              value={
                isManager
                  ? currentMealRate.toFixed(2)
                  : currentUserBalance.toFixed(2)
              }
              prefix="৳"
              precision={2}
              valueStyle={{
                color: isManager
                  ? "#389e0d"
                  : currentUserBalance >= 0
                  ? "#389e0d"
                  : "#cf1322",
              }}
              suffix={
                isManager ? (
                  <SwapOutlined />
                ) : currentUserBalance >= 0 ? (
                  <EyeOutlined />
                ) : (
                  <EyeInvisibleOutlined />
                )
              }
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Member Financial Details</Divider>

      {/* --- Chart Area --- */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <MemberBalanceChart stats={stats} currentUserId={userIdForChart} />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Extra Info (All Expenses)">
            <Text>
              Total Deposits Received:{" "}
              <strong>৳{stats.totalDeposits.toFixed(2)}</strong>
            </Text>
            <br />
            <Text>
              Total Expenses (All, Incl. Utility):{" "}
              <strong>৳{stats.totalExpenses.toFixed(2)}</strong>
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

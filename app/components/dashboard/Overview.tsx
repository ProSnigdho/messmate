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

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  ChartTooltip,
  ChartLegend
);

import {
  useOverviewData,
  OverviewStats,
} from "../../lib/hooks/useOverviewData";
import { useNotices, Notice } from "../../lib/hooks/useNotices";
import { useAuth } from "../../lib/auth-context";
import moment from "moment";

const { Title, Text } = Typography;
const { Column } = Table;

const PRIMARY_COLOR = "#00695C";
const ACCENT_COLOR_PROFILE = "#00897b";
const ACCENT_COLOR_WARNING = "#ff8f00";

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
  GroceryPaid: ACCENT_COLOR_WARNING,
  MealCost: "#FF7875",
  FinalBalance: PRIMARY_COLOR,
};

const MemberBalanceChart: React.FC<{
  stats: OverviewStats;
  currentUserId: string | null;
}> = ({ stats, currentUserId }) => {
  const chartDataRaw: MemberChartData[] = stats.members.map((member) => {
    const finalBalance = stats.memberFinalBalances[member.uid] || 0;
    const groceryPaid = stats.memberGroceryPaid[member.uid] || 0;
    const mealCost = (stats.memberMealCounts[member.uid] || 0) * stats.mealRate;

    return {
      name: member.displayName + (member.uid === currentUserId ? " (You)" : ""),
      FinalBalance: finalBalance,
      GroceryPaid: groceryPaid,
      MealCost: mealCost,
      colorIndex: 0,
    };
  });

  const data = {
    labels: chartDataRaw.map((d) => d.name.split(" (You)")[0]),
    datasets: [
      {
        label: "Grocery Paid (৳)",
        data: chartDataRaw.map((d) => d.GroceryPaid),
        backgroundColor: CHART_COLORS.GroceryPaid,
        borderColor: CHART_COLORS.GroceryPaid,
        borderWidth: 1,
      },
      {
        label: "Meal Cost (৳)",
        data: chartDataRaw.map((d) => d.MealCost),
        backgroundColor: CHART_COLORS.MealCost,
        borderColor: CHART_COLORS.MealCost,
        borderWidth: 1,
      },
      {
        label: "Final Balance (৳)",
        data: chartDataRaw.map((d) => d.FinalBalance),
        backgroundColor: CHART_COLORS.FinalBalance,
        borderColor: CHART_COLORS.FinalBalance,
        borderWidth: 1,
      },
    ],
  };

  const [isMobile, setIsMobile] = useState(false);
  const [chartWidth, setChartWidth] = useState("100%");

  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);

      if (!mobileCheck) {
        setChartWidth(Math.max(stats.members.length * 150, 900) + "px");
      } else {
        setChartWidth("100%");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [stats.members.length]);

  const chartHeight = isMobile ? 350 : 400;

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: isMobile ? 10 : 12 },
        },
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            return chartDataRaw[context[0].dataIndex].name;
          },
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += "৳" + context.parsed.y.toFixed(2);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        title: { display: false },
        ticks: {
          display: isMobile ? false : true,
          maxRotation: 30,
          minRotation: 30,
          font: { size: isMobile ? 10 : 12 },
        },
      },
      y: {
        stacked: false,
        title: {
          display: true,
          text: "Amount (৳)",
          font: { size: 12 },
        },
        ticks: {
          callback: function (value: any) {
            return "৳" + value;
          },
        },
      },
    },
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
          📊 Member Financial Comparison
        </Title>
      }
      style={{ border: `1px solid ${PRIMARY_COLOR}33` }}
      styles={{ body: { padding: 16 } }}
    >
      <div
        style={{
          width: "100%",
          height: chartHeight,

          overflowX: "auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: isMobile ? "100%" : chartWidth,
            minWidth: isMobile ? "100%" : "auto",
            height: chartHeight,
            margin: "0 auto",
          }}
        >
          <Bar data={data} options={options} />
        </div>
      </div>
    </Card>
  );
};

const MemberDetailsTable: React.FC<{
  tableData: MemberDetailRow[];
}> = ({ tableData }) => {
  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
          📋 Member Financial Details
        </Title>
      }
      style={{ marginTop: 16, border: `1px solid ${PRIMARY_COLOR}33` }}
      styles={{ body: { padding: "0" } }}
    >
      <div style={{ width: "100%", overflowX: "auto" }}>
        <Table
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 650 }}
          size="middle"
          style={{ border: `1px solid ${PRIMARY_COLOR}33` }}
        >
          <Column
            title={
              <Text style={{ fontSize: 14, color: "#fff" }} strong>
                Member
              </Text>
            }
            dataIndex="name"
            key="name"
            fixed="left"
            width={120}
            render={(name) => (
              <Text strong style={{ fontSize: 14, color: PRIMARY_COLOR }}>
                {name}
              </Text>
            )}
            onHeaderCell={() => ({ style: { backgroundColor: PRIMARY_COLOR } })}
          />
          <Column
            title={
              <Text style={{ fontSize: 14, color: "#fff" }} strong>
                Meals
              </Text>
            }
            dataIndex="mealsTaken"
            key="mealsTaken"
            align="center"
            width={80}
            render={(value) => <Text style={{ fontSize: 13 }}>{value}</Text>}
            onHeaderCell={() => ({ style: { backgroundColor: PRIMARY_COLOR } })}
          />
          <Column
            title={
              <Text style={{ fontSize: 14, color: "#fff" }} strong>
                Meal Cost
              </Text>
            }
            dataIndex="mealCost"
            key="mealCost"
            align="right"
            width={100}
            render={(value) => (
              <Text style={{ fontSize: 13, color: CHART_COLORS.MealCost }}>
                ৳{value}
              </Text>
            )}
            onHeaderCell={() => ({ style: { backgroundColor: PRIMARY_COLOR } })}
          />
          <Column
            title={
              <Text style={{ fontSize: 14, color: "#fff" }} strong>
                Grocery Paid
              </Text>
            }
            dataIndex="groceryPaid"
            key="groceryPaid"
            align="right"
            width={100}
            render={(value) => (
              <Text
                strong
                style={{ color: CHART_COLORS.GroceryPaid, fontSize: 13 }}
              >
                ৳{value}
              </Text>
            )}
            onHeaderCell={() => ({ style: { backgroundColor: PRIMARY_COLOR } })}
          />
          <Column
            title={
              <Text style={{ fontSize: 14, color: "#fff" }} strong>
                Final Balance
              </Text>
            }
            dataIndex="finalBalance"
            key="finalBalance"
            align="right"
            fixed="right"
            width={120}
            render={(value) => (
              <Text
                strong
                style={{
                  color: value >= 0 ? "#389e0d" : "#cf1322",
                  fontSize: 14,
                }}
              >
                ৳{value}
              </Text>
            )}
            onHeaderCell={() => ({ style: { backgroundColor: PRIMARY_COLOR } })}
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
    <Card
      title={
        <Title level={5} style={{ margin: 0, color: PRIMARY_COLOR }}>
          📋 Member Financial Details
        </Title>
      }
      style={{ marginTop: 16 }}
      styles={{ body: { padding: "0px 12px" } }}
    >
      <List
        dataSource={tableData}
        renderItem={(item) => (
          <Card
            size="small"
            style={{
              marginBottom: 12,
              borderLeft:
                item.finalBalance >= 0
                  ? "4px solid #389e0d"
                  : "4px solid #cf1322",
            }}
          >
            <List.Item style={{ padding: 0 }}>
              <List.Item.Meta
                avatar={
                  <UserOutlined
                    style={{ fontSize: 20, color: PRIMARY_COLOR }}
                  />
                }
                title={
                  <Text strong style={{ color: PRIMARY_COLOR }}>
                    {item.name}
                  </Text>
                }
                description={`Meals: ${item.mealsTaken}`}
              />
              <div style={{ textAlign: "right" }}>
                <Text
                  strong
                  style={{
                    color: item.finalBalance >= 0 ? "#389e0d" : "#cf1322",
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
                    color: item.finalBalance >= 0 ? "#389e0d" : "#cf1322",
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
          <BellOutlined style={{ color: PRIMARY_COLOR }} />
          <Text
            strong
            style={{ margin: 0, fontSize: 18, color: PRIMARY_COLOR }}
          >
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
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
        >
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
                  borderLeft: !useNoticeReadStatus().isNoticeRead(item.id)
                    ? `4px solid ${ACCENT_COLOR_PROFILE}`
                    : "none",
                  paddingLeft: !useNoticeReadStatus().isNoticeRead(item.id)
                    ? "8px"
                    : "0px",
                  backgroundColor: !useNoticeReadStatus().isNoticeRead(item.id)
                    ? "#f7fcfc"
                    : "white",
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
                      <Text
                        strong
                        style={{ fontSize: 16, color: PRIMARY_COLOR }}
                      >
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

  const [isLargeScreen, setIsLargeScreen] = useState(true);
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1200);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        style={{ margin: "16px" }}
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
    <div style={{ padding: 20, position: "relative" }}>
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
          }}
        >
          <Title
            level={isLargeScreen ? 2 : 3}
            style={{
              color: PRIMARY_COLOR,
              margin: 0,
            }}
          >
            🏠 Mess Financial Overview
            <Text
              type="secondary"
              style={{ fontSize: isLargeScreen ? 18 : 14, marginLeft: 10 }}
            >
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

            marginRight: isLargeScreen ? 20 : 10,
          }}
        >
          <Badge count={unreadCount} size="small" offset={[-5, 5]}>
            <Button
              type="text"
              icon={
                <BellOutlined
                  style={{
                    fontSize: isLargeScreen ? 24 : 20,
                    color: unreadCount > 0 ? ACCENT_COLOR_PROFILE : "#666",
                  }}
                />
              }
              onClick={() => setNoticesPopupVisible(true)}
              style={{
                width: isLargeScreen ? 48 : 40,
                height: isLargeScreen ? 48 : 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border:
                  unreadCount > 0
                    ? `2px solid ${ACCENT_COLOR_PROFILE}`
                    : "2px solid #d9d9d9",
                background: unreadCount > 0 ? "#f7fcfc" : "#fafafa",
              }}
            />
          </Badge>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderLeft: `4px solid ${PRIMARY_COLOR}` }}>
            <Statistic
              title="Total Members"
              value={totalMembers}
              prefix={<UserOutlined style={{ color: PRIMARY_COLOR }} />}
              valueStyle={{ color: PRIMARY_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderLeft: `4px solid ${ACCENT_COLOR_PROFILE}` }}>
            <Statistic
              title="Total Meals"
              value={totalMonthlyMeals}
              prefix={<FireOutlined style={{ color: ACCENT_COLOR_PROFILE }} />}
              valueStyle={{ color: ACCENT_COLOR_PROFILE }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderLeft: `4px solid #cf1322` }}>
            <Statistic
              title="Food Expenses"
              value={totalGroceryCost}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#cf1322" }}
              suffix={<ShoppingOutlined style={{ color: "#cf1322" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderLeft: `4px solid ${ACCENT_COLOR_WARNING}` }}>
            <Statistic
              title="Meal Rate"
              value={currentMealRate}
              prefix="৳"
              precision={2}
              valueStyle={{ color: ACCENT_COLOR_WARNING }}
              suffix={
                <CalculatorOutlined style={{ color: ACCENT_COLOR_WARNING }} />
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={8}>
          <Card style={{ borderLeft: `4px solid #389e0d` }}>
            <Statistic
              title="Total Deposits"
              value={stats.totalDeposits}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#389e0d" }}
              suffix={<BankOutlined style={{ color: "#389e0d" }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8}>
          <Card style={{ borderLeft: `4px solid #faad14` }}>
            <Statistic
              title="Utility Expenses"
              value={stats.totalUtilityCost}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#faad14" }}
              suffix={<SwapOutlined style={{ color: "#faad14" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card style={{ borderLeft: `4px solid #722ed1` }}>
            <Statistic
              title="Utility Per Member"
              value={stats.utilityCostPerMember}
              prefix="৳"
              precision={0}
              valueStyle={{ color: "#722ed1" }}
              suffix={<TeamOutlined style={{ color: "#722ed1" }} />}
            />
          </Card>
        </Col>
      </Row>

      <Divider
        orientation="left"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        Financial Analysis
      </Divider>

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
        <Card
          title={
            <Title level={4} style={{ margin: 0, color: PRIMARY_COLOR }}>
              📊 Your Financial Summary
            </Title>
          }
          style={{ marginTop: 24, border: `1px solid ${PRIMARY_COLOR}33` }}
          styles={{ body: { padding: 16 } }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6} lg={4}>
              <Statistic
                title="Your Meals"
                value={stats.memberMealCounts[currentUserId || ""] || 0}
                prefix={<FireOutlined />}
                valueStyle={{ color: ACCENT_COLOR_PROFILE }}
              />
            </Col>
            <Col xs={12} sm={6} lg={4}>
              <Statistic
                title="Your Grocery Paid"
                value={stats.memberGroceryPaid[currentUserId || ""] || 0}
                prefix="৳"
                valueStyle={{ color: CHART_COLORS.GroceryPaid }}
              />
            </Col>
            <Col xs={12} sm={6} lg={4}>
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
            <Col xs={12} sm={6} lg={4}>
              <Statistic
                title="Your Utility Share"
                value={stats.utilityCostPerMember}
                prefix="৳"
                precision={0}
                valueStyle={{ color: "#722ed1" }}
              />
            </Col>
          </Row>
          <Divider style={{ margin: "16px 0", borderColor: PRIMARY_COLOR }} />
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <Text
              strong
              style={{
                fontSize: 20,
                display: "block",
                marginBottom: 4,
                color: PRIMARY_COLOR,
              }}
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
                <ArrowUpOutlined style={{ color: "#389e0d", fontSize: 36 }} />
              ) : (
                <ArrowDownOutlined style={{ color: "#cf1322", fontSize: 36 }} />
              )}

              <Title
                level={isLargeScreen ? 1 : 2}
                style={{
                  margin: 0,
                  color: currentUserFinalBalance >= 0 ? "#389e0d" : "#cf1322",
                }}
              >
                ৳{Math.abs(currentUserFinalBalance).toFixed(2)}
              </Title>
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 14, display: "block", marginTop: 4 }}
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

      <style jsx global>{`
        /* General Table Header Styling */
        .ant-table-wrapper .ant-table-thead > tr > th {
          background-color: ${PRIMARY_COLOR} !important;
          color: #fff !important;
          font-size: 14px !important; /* Smaller default for better laptop fit */
          padding: 10px 10px !important;
        }

        /* Responsive Table Header Font Size */
        @media (min-width: 1600px) {
          .ant-table-wrapper .ant-table-thead > tr > th {
            font-size: 16px !important; /* Slightly larger for very large monitors */
          }
        }
        @media (max-width: 768px) {
          .ant-table-wrapper .ant-table-thead > tr > th {
            font-size: 12px !important; /* Smaller on mobile */
            padding: 8px 8px !important;
          }
        }

        /* Remove the problematic fixed font size utility */
        .ant-statistic-content {
          font-size: 30px;
        }

        @media (max-width: 768px) {
          .ant-statistic-content {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

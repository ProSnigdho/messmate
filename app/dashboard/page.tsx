"use client";

import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Typography,
  Avatar,
  Dropdown,
  Button,
  Spin,
  Alert,
  message,
} from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  FireOutlined,
  DollarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import { useSettings } from "../lib/hooks/useSettings";
import Overview from "../components/dashboard/Overview";
import MealTracker from "../components/dashboard/MealTracker";
import ExpenseManager from "../components/dashboard/ExpenseManager";
import BalanceSheet from "../components/dashboard/BalanceSheet";
import DepositManager from "../components/dashboard/Deposit";
import NoticeBoard from "../components/dashboard/NoticeBoard";
import MembersManager from "../components/dashboard/MembersManager";
import GroceryList from "../components/dashboard/GroceryList";
import SettingsPage from "../components/dashboard/SettingsPage";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("1");
  const { user, loading, isManager, logout } = useAuth();
  const { messSettings } = useSettings();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || redirecting) return;

    if (!user) {
      setRedirecting(true);
      router.replace("/auth");
      return;
    }

    if (!user.messId) {
      setRedirecting(true);
      message.warning("Please create or join a mess first.");
      router.replace("/onboarding");
    }
  }, [loading, user, redirecting, router]);

  const handleLogout = async () => {
    setRedirecting(true);
    try {
      await logout();
      message.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
      message.error("Logout failed. Please try again.");
      setRedirecting(false);
    }
  };

  if (loading || redirecting || !user || !user.messId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <Spin size="large" />
        <Text type="secondary" style={{ marginTop: 16 }}>
          {redirecting
            ? "Redirecting to correct page..."
            : "Loading session..."}
        </Text>
      </div>
    );
  }

  const messId = user.messId;
  const userRole = user.role;

  const managerMenuItems: MenuItem[] = [
    { key: "3", icon: <DollarOutlined />, label: "Expense Manager" },
    { key: "8", icon: <DollarOutlined />, label: "Balance Sheet" },
    { key: "4", icon: <TeamOutlined />, label: "Members" },
  ];

  const sharedMenuItems: MenuItem[] = [
    { key: "1", icon: <DashboardOutlined />, label: "Overview" },
    { key: "6", icon: <BellOutlined />, label: "Notices" },
    { key: "2", icon: <FireOutlined />, label: "Meal Tracker" },
    { key: "9", icon: <DollarOutlined />, label: "Deposits" },
    { key: "5", icon: <ShoppingOutlined />, label: "Grocery List" },
    { key: "7", icon: <SettingOutlined />, label: "Settings" },
  ];

  const menuItems: MenuItem[] = isManager
    ? [...sharedMenuItems, ...managerMenuItems]
    : sharedMenuItems;

  const userMenuItems: MenuProps["items"] = [
    {
      key: "1",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "2",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "3",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case "1":
        return <Overview messId={messId} userRole={userRole} />;

      case "2":
        return <MealTracker />;

      case "9":
        return <DepositManager messId={messId} />;

      case "3":
        if (!isManager) {
          return (
            <Alert
              message="Access Denied"
              description="Only managers can access expense management"
              type="error"
              showIcon
            />
          );
        }
        return <ExpenseManager messId={messId} />;

      case "4":
        if (!isManager) {
          return (
            <Alert
              message="Access Denied"
              description="Only managers can manage members"
              type="error"
              showIcon
            />
          );
        }
        return <MembersManager messId={messId} />;

      case "5":
        return <GroceryList messId={messId} />;

      case "6":
        return <NoticeBoard messId={messId} />;

      case "7":
        return <SettingsPage />;

      case "8":
        if (!isManager) {
          return (
            <Alert
              message="Access Denied"
              description="Only managers can access balance sheet"
              type="error"
              showIcon
            />
          );
        }
        return <BalanceSheet messId={messId} />;

      default:
        return <Overview messId={messId} userRole={userRole} />;
    }
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find((item) => item?.key === selectedKey);
    return (currentItem as any)?.label || "Dashboard";
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        breakpoint="md"
        collapsedWidth="0"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            padding: "16px",
            textAlign: "center" as const,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Title level={4} style={{ color: "#004d40", margin: 0 }}>
            {collapsed ? "MM" : "MessMate"}
          </Title>
          {!collapsed && user && (
            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  display: "block",
                  marginTop: 8,
                  fontWeight: "bold",
                }}
              >
                {messSettings?.messName || "Our Mess"}
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 10, display: "block", marginTop: 4 }}
              >
                Mess ID: {user.messId}
              </Text>
            </div>
          )}
        </div>

        <Menu
          theme="light"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
          style={{ border: "none" }}
        />
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 0 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 16px",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Title level={4} style={{ margin: 0, color: "#004d40" }}>
              {getCurrentPageTitle()}
            </Title>
          </div>

          {user && (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button
                type="text"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: "auto",
                  padding: "8px 12px",
                  borderRadius: "8px",
                }}
              >
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: isManager ? "#ff4d4f" : "#1890ff",
                  }}
                  icon={<UserOutlined />}
                />
                <div
                  style={{
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    maxWidth: "120px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.displayName || user.email}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {isManager ? "👑 Manager" : "👤 Member"}
                  </div>
                </div>
              </Button>
            </Dropdown>
          )}
        </Header>

        <Content
          style={{
            margin: "16px",
            padding: "16px",
            background: "#fff",
            borderRadius: 8,
            minHeight: "calc(100vh - 112px)",
            overflowX: "auto",
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

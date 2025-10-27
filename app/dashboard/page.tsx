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
  Drawer,
  Tag,
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
  MenuOutlined,
  HomeOutlined,
  IdcardOutlined,
  CopyOutlined,
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
  const [messageApi, contextHolder] = message.useMessage();

  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("1");
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
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

    if (!user.emailVerified) {
      setRedirecting(true);
      messageApi.warning("Please verify your email first.");
      router.replace("/auth");
      return;
    }

    if (!user.messId) {
      setRedirecting(true);
      messageApi.warning("Please create or join a mess first.");
      router.replace("/onboarding");
    }
  }, [loading, user, redirecting, router, messageApi]);

  const handleLogout = async () => {
    setRedirecting(true);
    try {
      await logout();
      messageApi.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
      messageApi.error("Logout failed. Please try again.");
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
        {contextHolder}
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

  const handleMenuClick = (key: string) => {
    setSelectedKey(key);
    setMobileDrawerVisible(false);
  };

  const siderContent = (
    <>
      <div
        style={{
          padding: "20px 16px",
          textAlign: "center" as const,
          borderBottom: "1px solid #f0f0f0",
          background: "linear-gradient(135deg, #004d40 0%, #00796b 100%)",
        }}
      >
        <Title
          level={3}
          style={{
            color: "white",
            margin: "0 0 16px 0",
            fontSize: collapsed ? "18px" : "24px",
            fontWeight: "700",
            letterSpacing: "0.5px",
          }}
        >
          {collapsed ? "MM" : "MessMate"}
        </Title>
        {!collapsed && user && (
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                backdropFilter: "blur(10px)",
              }}
            >
              <HomeOutlined style={{ color: "#80cbc4", fontSize: "16px" }} />
              <div style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    display: "block",
                    lineHeight: "1.3",
                  }}
                >
                  {messSettings?.messName || "Our Mess"}
                </Text>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
              }}
            >
              <IdcardOutlined style={{ color: "#80cbc4", fontSize: "14px" }} />

              <Text
                copyable={{
                  text: user.messId,
                  tooltips: ["Copy Mess ID", "Copied!"],
                  onCopy: () => messageApi.success("Mess ID copied!"),

                  icon: <CopyOutlined style={{ color: "#ffffff" }} />,
                }}
                style={{
                  color: "#e0f2f1",
                  fontSize: "12px",
                  fontWeight: "500",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                }}
              >
                ID: {user.messId}
              </Text>
            </div>
          </div>
        )}
      </div>

      <Menu
        theme="light"
        selectedKeys={[selectedKey]}
        mode="inline"
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{
          border: "none",
          padding: "8px 0",
        }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {contextHolder}

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}
        breakpoint="md"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
        className="desktop-sider"
      >
        {siderContent}
      </Sider>

      <Drawer
        title={
          <div style={{ textAlign: "center" }}>
            <Title
              level={3}
              style={{
                color: "#004d40",
                margin: "0 0 16px 0",
                fontWeight: "700",
              }}
            >
              MessMate
            </Title>
            {user && (
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    padding: "8px 12px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                  }}
                >
                  <HomeOutlined
                    style={{ color: "#004d40", fontSize: "16px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#004d40",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "block",
                        lineHeight: "1.3",
                      }}
                    >
                      {messSettings?.messName || "Our Mess"}
                    </Text>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    background: "#fafafa",
                    borderRadius: "6px",
                    marginBottom: 8,
                  }}
                >
                  <IdcardOutlined
                    style={{ color: "#004d40", fontSize: "14px" }}
                  />

                  <Text
                    copyable={{
                      text: user.messId,
                      tooltips: ["Copy Mess ID", "Copied!"],
                      onCopy: () => messageApi.success("Mess ID copied!"),

                      icon: <CopyOutlined style={{ color: "#004d40" }} />,
                    }}
                    style={{
                      color: "#666",
                      fontSize: "12px",
                      fontWeight: "500",
                      letterSpacing: "0.5px",
                      cursor: "pointer",
                    }}
                  >
                    ID: {user.messId}
                  </Text>
                </div>
              </div>
            )}
          </div>
        }
        placement="left"
        onClose={() => setMobileDrawerVisible(false)}
        open={mobileDrawerVisible}
        styles={{
          body: { padding: 0 },
        }}
        width={280}
        className="mobile-drawer"
      >
        <Menu
          theme="light"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            border: "none",
            padding: "8px 0",
          }}
        />
      </Drawer>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
        className="main-layout"
      >
        <Header
          style={{
            padding: "0 16px",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 99,
            width: "100%",
          }}
          className="dashboard-header"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileDrawerVisible(true)}
              style={{
                display: "none",
              }}
              className="mobile-menu-button"
            />
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#004d40",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
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
                  padding: "6px 12px",
                  borderRadius: "8px",
                }}
                className="user-dropdown-button"
              >
                <Avatar
                  size="small"
                  style={{
                    backgroundColor: isManager ? "#ff4d4f" : "#1890ff",
                  }}
                  icon={<UserOutlined />}
                />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>
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
            padding: 16,
            background: "#fff",
            borderRadius: 8,
            minHeight: "calc(100vh - 96px)",
            overflow: "initial",
          }}
          className="dashboard-content"
        >
          {renderContent()}
        </Content>
      </Layout>

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-sider {
            display: none !important;
          }

          .mobile-menu-button {
            display: block !important;
          }

          .main-layout {
            margin-left: 0 !important;
          }

          .dashboard-header {
            padding: 0 12px !important;
          }

          .dashboard-content {
            margin: 12px !important;
            padding: 12px !important;
            min-height: calc(100vh - 80px) !important;
          }

          .user-dropdown-button .ant-btn {
            padding: 4px 8px !important;
          }

          .user-dropdown-button .ant-avatar {
            width: 24px !important;
            height: 24px !important;
            line-height: 24px !important;
          }
        }

        @media (max-width: 480px) {
          .dashboard-content {
            margin: 8px !important;
            padding: 12px !important;
          }

          .dashboard-header {
            padding: 0 8px !important;
          }

          .user-dropdown-button .ant-btn {
            padding: 2px 6px !important;
          }

          .user-dropdown-button .ant-btn > span:last-child {
            display: none;
          }
        }

        @media (min-width: 769px) {
          .mobile-drawer {
            display: none !important;
          }

          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
}

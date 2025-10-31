"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Checkbox,
  message,
  Alert,
  Spin,
  Divider,
  DatePicker,
  Select,
  Tag,
  Button,
  InputNumber,
  Row,
  Col,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import {
  doc,
  setDoc,
  collection,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../lib/auth-context";
import { useMealTracking } from "../../lib/hooks/useMealTracking";
import { updateMeal } from "../../lib/database";
import { db } from "../../lib/firebase";
import type { Meal, UserProfile } from "../../lib/types";
import Dayjs from "dayjs";
import type { Dayjs as DayjsType } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type MealType = "breakfast" | "lunch" | "dinner";
type RangeValue = [DayjsType | null, DayjsType | null] | null;

interface FullMealHistoryEntry {
  key: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  guestMeals: number;
  total: number;
}

interface BillingSummaryProps {
  userMealData: any[];
  billingSummary: {
    totalMeals: number;
    totalGroceryCost: number;
    mealRate: number;
  };
  loading: boolean;
}

const PRIMARY_COLOR = "#00695C";
const ACCENT_COLOR_WARNING = "#ff8f00";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);
  return isMobile;
};

const MonthlyBillingSummary: React.FC<BillingSummaryProps> = ({
  userMealData,
  billingSummary,
  loading,
}) => {
  const { totalMeals, totalGroceryCost, mealRate } = billingSummary;
  const isMobile = useIsMobile();

  const dataSource = userMealData.map((data: any) => {
    const totalMealsValue = data.monthlyTotalMeals || 0;
    const totalPaidValue = data.monthlyTotalPaid || 0;

    const mealCost = totalMealsValue * mealRate;
    const totalPaid = totalPaidValue;

    const paidVsDue = totalPaid - mealCost;

    return {
      key: data.user.uid,
      name: data.user.displayName,
      totalMeals: totalMealsValue,
      totalPaid: totalPaid,
      mealCost: mealCost,
      paidVsDue: paidVsDue,
    };
  });

  const mobileColumns = [
    {
      title: "Member",
      dataIndex: "name",
      key: "name",
      width: 80,
      render: (text: string) => (
        <div
          style={{ fontSize: "12px", lineHeight: "1.2", color: PRIMARY_COLOR }}
        >
          {text.length > 8 ? `${text.substring(0, 8)}...` : text}
        </div>
      ),
    },
    {
      title: "Meals",
      dataIndex: "totalMeals",
      key: "totalMeals",
      align: "center" as const,
      width: 50,
      render: (text: number) => (
        <Text strong style={{ fontSize: "12px", color: PRIMARY_COLOR }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Paid",
      dataIndex: "totalPaid",
      key: "totalPaid",
      align: "right" as const,
      width: 60,
      render: (text: number) => (
        <Text strong style={{ fontSize: "12px", color: ACCENT_COLOR_WARNING }}>
          {text.toFixed(2)}৳
        </Text>
      ),
    },
    {
      title: "Balance",
      dataIndex: "paidVsDue",
      key: "paidVsDue",
      align: "center" as const,
      width: 80,
      render: (text: number) => {
        const amount = text;

        if (amount > 0.01) {
          return (
            <Tag
              color="green"
              style={{ fontSize: "10px", padding: "1px 3px", margin: 0 }}
            >
              +{amount.toFixed(2)}৳
            </Tag>
          );
        } else if (amount < -0.01) {
          return (
            <Tag
              color="red"
              style={{ fontSize: "10px", padding: "1px 3px", margin: 0 }}
            >
              -{Math.abs(amount).toFixed(2)}৳
            </Tag>
          );
        } else {
          return (
            <Tag
              color="blue"
              style={{ fontSize: "10px", padding: "1px 3px", margin: 0 }}
            >
              0.00৳
            </Tag>
          );
        }
      },
    },
  ];

  const desktopColumns = [
    { title: "Member", dataIndex: "name", key: "name", width: 90 },
    {
      title: "Total Meals",
      dataIndex: "totalMeals",
      key: "totalMeals",
      align: "center" as const,
      width: 90,
    },
    {
      title: "Total Paid",
      dataIndex: "totalPaid",
      key: "totalPaid",
      align: "right" as const,
      width: 90,
      render: (text: number) => (
        <Text strong style={{ color: ACCENT_COLOR_WARNING }}>
          {text.toFixed(2)} ৳
        </Text>
      ),
    },
    {
      title: "Meal Cost",
      dataIndex: "mealCost",
      key: "mealCost",
      align: "right" as const,
      width: 90,
      render: (text: number) => <Text>{text.toFixed(2)} ৳</Text>,
    },
    {
      title: "Final Balance",
      dataIndex: "paidVsDue",
      key: "paidVsDue",
      align: "right" as const,
      width: 140,
      render: (text: number) => {
        const amount = text;

        if (amount > 0.01) {
          return (
            <Tag color="green" style={{ padding: "2px 4px" }}>
              will get: {amount.toFixed(2)} ৳
            </Tag>
          );
        } else if (amount < -0.01) {
          return (
            <Tag color="red" style={{ padding: "2px 4px" }}>
              have to give: {Math.abs(amount).toFixed(2)} ৳
            </Tag>
          );
        } else {
          return (
            <Tag color="blue" style={{ padding: "2px 4px" }}>
              Settled
            </Tag>
          );
        }
      },
    },
  ];

  const columns = isMobile ? mobileColumns : desktopColumns;

  return (
    <Card
      title={
        <Title
          level={isMobile ? 5 : 4}
          style={{
            margin: 0,
            fontSize: isMobile ? "16px" : "18px",
            color: PRIMARY_COLOR,
          }}
        >
          💰 Monthly Billing Summary
        </Title>
      }
      style={{ marginTop: 16 }}
      loading={loading}
      size={isMobile ? "small" : "default"}
    >
      <div
        style={{
          marginBottom: 12,
          border: `1px solid ${PRIMARY_COLOR}33`,
          padding: isMobile ? "6px" : "8px",
          borderRadius: "4px",
          backgroundColor: "#f7fcfc",
        }}
      >
        <Row
          gutter={[isMobile ? 4 : 8, isMobile ? 4 : 4]}
          justify="space-between"
        >
          <Col xs={24} sm={8}>
            <Text style={{ fontSize: isMobile ? "12px" : "14px" }}>
              Total Meals:{" "}
            </Text>
            <Text
              strong
              style={{
                fontSize: isMobile ? "12px" : "14px",
                color: PRIMARY_COLOR,
              }}
            >
              {totalMeals}
            </Text>
          </Col>
          <Col xs={24} sm={8}>
            <Text style={{ fontSize: isMobile ? "12px" : "14px" }}>
              Total Cost:{" "}
            </Text>
            <Text strong style={{ fontSize: isMobile ? "12px" : "14px" }}>
              {totalGroceryCost.toFixed(2)}৳
            </Text>
          </Col>
          <Col xs={24} sm={8}>
            <Text style={{ fontSize: isMobile ? "12px" : "14px" }}>
              Meal Rate:{" "}
            </Text>
            <Text
              strong
              style={{
                fontSize: isMobile ? "12px" : "14px",
                color: ACCENT_COLOR_WARNING,
              }}
            >
              {mealRate.toFixed(2)}৳
            </Text>
          </Col>
        </Row>
      </div>

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="key"
        pagination={false}
        bordered
        size={isMobile ? "small" : "middle"}
        scroll={isMobile ? { x: 300 } : { x: "max-content" }}
        style={{ border: `1px solid ${PRIMARY_COLOR}33` }}
      />
    </Card>
  );
};

const convertToCSV = (
  data: FullMealHistoryEntry[],
  memberName: string,
  dateRange: RangeValue
): string => {
  if (data.length === 0) return "";

  const rangeStart = dateRange ? dateRange[0]?.format("DD MMM YYYY") : "N/A";
  const rangeEnd = dateRange ? dateRange[1]?.format("DD MMM YYYY") : "N/A";

  let csv = `\n\n`;
  csv += `Meal History for: ${memberName}\n`;
  csv += `Date Range: ${rangeStart} to ${rangeEnd}\n\n`;

  const headers = [
    "Date",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Guest Meals",
    "Daily Total",
  ];
  csv += headers.join(",") + "\n";

  data.forEach((item) => {
    const row = [
      item.date,
      item.breakfast ? "1" : "0",
      item.lunch ? "1" : "0",
      item.dinner ? "1" : "0",
      item.guestMeals.toString(),
      item.total.toString(),
    ];
    csv += row.join(",") + "\n";
  });

  const grandTotal = data.reduce((sum, item) => sum + item.total, 0);

  csv += `\n,,,,,Total Meals in Range: ${grandTotal}`;
  csv += `\n`;

  return csv;
};

const MonthlyMealHistory: React.FC<{
  messId: string;
  allMembers: { uid: string; displayName: string }[];
  isManager: boolean;
}> = ({ messId, allMembers, isManager }) => {
  if (!isManager) return null;

  const isMobile = useIsMobile();

  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(
    undefined
  );
  const [dateRange, setDateRange] = useState<RangeValue>([
    Dayjs().startOf("month"),
    Dayjs().endOf("month"),
  ]);
  const [historyData, setHistoryData] = useState<FullMealHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedMemberName = useMemo(() => {
    return (
      allMembers.find((m) => m.uid === selectedMemberId)?.displayName ||
      "Selected Member"
    );
  }, [allMembers, selectedMemberId]);

  const memberOptions = allMembers.map((member) => ({
    label: member.displayName,
    value: member.uid,
  }));

  const grandTotal = useMemo(() => {
    return historyData.reduce((sum, entry) => sum + entry.total, 0);
  }, [historyData]);

  useEffect(() => {
    if (!selectedMemberId && allMembers.length > 0) {
      setSelectedMemberId(allMembers[0].uid);
    }
  }, [allMembers, selectedMemberId]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedMemberId || !dateRange || !dateRange[0] || !dateRange[1]) {
        setHistoryData([]);
        return;
      }

      setHistoryLoading(true);

      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      try {
        const mealsRef = collection(db, "meals");
        const q = query(
          mealsRef,
          where("messId", "==", messId),
          where("userId", "==", selectedMemberId),
          where("date", ">=", startDate),
          where("date", "<=", endDate)
        );

        const snapshot = await getDocs(q);
        const data: FullMealHistoryEntry[] = snapshot.docs.map((doc) => {
          const meal = doc.data() as Meal;
          const guestMeals = meal.guestMeals || 0;

          const total =
            (meal.breakfast ? 1 : 0) +
            (meal.lunch ? 1 : 0) +
            (meal.dinner ? 1 : 0) +
            guestMeals;

          return {
            key: doc.id,
            date: meal.date,
            breakfast: meal.breakfast || false,
            lunch: meal.lunch || false,
            dinner: meal.dinner || false,
            guestMeals: guestMeals,
            total,
          };
        });

        setHistoryData(data.sort((a, b) => (a.date < b.date ? 1 : -1)));
      } catch (error) {
        console.error("Error fetching meal history:", error);
        message.error("Failed to load meal history.");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [messId, selectedMemberId, dateRange]);

  const handleDownloadCSV = () => {
    if (historyData.length === 0) {
      message.warning("No data to download for the selected period.");
      return;
    }

    const csvContent = convertToCSV(historyData, selectedMemberName, dateRange);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const filename = `${selectedMemberName}_Meal_History_${dateRange?.[0]?.format(
      "YYYYMMDD"
    )}_to_${dateRange?.[1]?.format("YYYYMMDD")}.csv`;
    link.setAttribute("download", filename);
    link.click();

    message.success("CSV file generated and downloaded!");
  };

  const mobileHistoryColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 80,
      render: (text: string) => {
        const parts = text.split("-");
        const date = parts[2];
        const month = parts[1];
        return <div style={{ fontSize: "11px" }}>{`${date}/${month}`}</div>;
      },
    },
    {
      title: "B/F",
      dataIndex: "breakfast",
      key: "breakfast",
      align: "center" as const,
      width: 40,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Lunch",
      dataIndex: "lunch",
      key: "lunch",
      align: "center" as const,
      width: 40,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Dinner",
      dataIndex: "dinner",
      key: "dinner",
      align: "center" as const,
      width: 40,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Guest",
      dataIndex: "guestMeals",
      key: "guestMeals",
      align: "center" as const,
      width: 40,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      width: 40,
      render: (text: number) => (
        <Text strong style={{ fontSize: "11px", color: PRIMARY_COLOR }}>
          {text}
        </Text>
      ),
    },
  ];

  const desktopHistoryColumns = [
    { title: "Date", dataIndex: "date", key: "date", width: 100 },
    {
      title: "Breakfast",
      dataIndex: "breakfast",
      key: "breakfast",
      align: "center" as const,
      width: 80,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Lunch",
      dataIndex: "lunch",
      key: "lunch",
      align: "center" as const,
      width: 80,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Dinner",
      dataIndex: "dinner",
      key: "dinner",
      align: "center" as const,
      width: 80,
      render: (e: boolean) => (e ? "✅" : "❌"),
    },
    {
      title: "Guest Meals",
      dataIndex: "guestMeals",
      key: "guestMeals",
      align: "center" as const,
      width: 100,
    },
    {
      title: "Daily Total",
      dataIndex: "total",
      key: "total",
      align: "center" as const,
      width: 100,
      render: (text: number) => (
        <Text strong style={{ color: PRIMARY_COLOR }}>
          {text}
        </Text>
      ),
    },
  ];

  const columns = isMobile ? mobileHistoryColumns : desktopHistoryColumns;

  return (
    <Card
      title={
        <Title
          level={isMobile ? 5 : 4}
          style={{
            margin: 0,
            fontSize: isMobile ? "16px" : "18px",
            color: PRIMARY_COLOR,
          }}
        >
          🗓️ Monthly Meal History
        </Title>
      }
      extra={
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownloadCSV}
          disabled={historyLoading || historyData.length === 0}
          size={isMobile ? "small" : "middle"}
          style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
        >
          {isMobile ? "" : "Download CSV"}
        </Button>
      }
      style={{ marginTop: 16 }}
      size={isMobile ? "small" : "default"}
    >
      <Row
        gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}
        style={{ marginBottom: 16 }}
      >
        <Col xs={24} md={12}>
          {" "}
          <Text
            strong
            style={{ display: "block", marginBottom: 4, color: PRIMARY_COLOR }}
          >
            Select Member:
          </Text>
          <Select
            style={{ width: "100%" }}
            placeholder="Select a member"
            options={memberOptions}
            value={selectedMemberId}
            onChange={setSelectedMemberId}
            disabled={historyLoading}
            size={isMobile ? "small" : "middle"}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text
            strong
            style={{ display: "block", marginBottom: 4, color: PRIMARY_COLOR }}
          >
            Date Range:
          </Text>
          <RangePicker
            style={{ width: "100%" }}
            value={dateRange}
            onChange={(dates) => setDateRange(dates as RangeValue)}
            format="DD-MM-YY"
            disabled={historyLoading}
            size={isMobile ? "small" : "middle"}
          />
        </Col>
      </Row>

      <Table
        dataSource={historyData}
        columns={columns}
        rowKey="key"
        loading={historyLoading}
        pagination={{ pageSize: 7, size: "small" }}
        bordered
        size={isMobile ? "small" : "middle"}
        scroll={isMobile ? { x: 300 } : { x: "max-content" }}
        style={{ border: `1px solid ${PRIMARY_COLOR}33` }}
      />

      <div style={{ marginTop: 12, textAlign: "right" }}>
        <Text strong style={{ fontSize: isMobile ? "12px" : "14px" }}>
          Selected Range Total Meals:{" "}
        </Text>
        <Text
          strong
          style={{
            fontSize: isMobile ? "12px" : "14px",
            color: PRIMARY_COLOR,
          }}
        >
          {grandTotal}
        </Text>
      </div>
    </Card>
  );
};

const MealTracker: React.FC = () => {
  const { user, isManager } = useAuth();
  const { userMealData, loading, currentDate, messId, billingSummary } =
    useMealTracking();
  const [isUpdating, setIsUpdating] = useState(false);
  const isMobile = useIsMobile(); // ব্যবহার করা হচ্ছে

  const currentUser = user as UserProfile | null;

  const formattedDate = new Date(currentDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (!currentUser || !messId)
    return (
      <Alert
        message="Mess Required"
        description="Please create or join a mess to track meals."
        type="warning"
        showIcon
        style={{ margin: "16px 8px" }}
      />
    );

  const handleGuestMealChange = async (
    record: any,
    value: number | null | undefined
  ) => {
    if (isUpdating) return;

    const guestMealsCount =
      value === null || value === undefined || isNaN(value) || value < 0
        ? 0
        : value;

    if (!isManager && record.user.uid !== currentUser.uid) {
      message.error("You can only update your own meals.");
      return;
    }

    setIsUpdating(true);

    try {
      const userId = record.user.uid;
      const existingMealId = record.meals.id;
      const userName = record.user.displayName || "Unknown User";

      if (existingMealId) {
        await updateMeal(existingMealId, {
          guestMeals: guestMealsCount,
        } as Partial<Meal>);
        message.success(
          `${userName}'s guest meals updated to ${guestMealsCount}!`
        );
      } else {
        const docRef = doc(collection(db, "meals"));
        await setDoc(docRef, {
          messId: messId,
          userId: userId,
          userName: userName,
          date: currentDate,
          breakfast: record.meals.breakfast || false,
          lunch: record.meals.lunch || false,
          dinner: record.meals.dinner || false,
          guestMeals: guestMealsCount,
          createdAt: Timestamp.now(),
        } as Omit<Meal, "id">);

        message.success(`${userName}'s meal record created with guest meals!`);
      }
    } catch (error) {
      console.error("Guest meal update failed:", error);
      message.error(`Failed to update guest meal: ${(error as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMealToggle = async (
    record: any,
    mealType: MealType,
    checked: boolean
  ) => {
    if (isUpdating) return;

    if (!isManager && record.user.uid !== currentUser.uid) {
      message.error("You can only update your own meals.");
      return;
    }

    setIsUpdating(true);

    try {
      const userId = record.user.uid;
      const existingMealId = record.meals.id;
      const userName = record.user.displayName || "Unknown User";

      const updatedFields: Partial<Meal> = {
        [mealType]: checked,
        guestMeals: record.meals.guestMeals || 0,
      };

      if (existingMealId) {
        await updateMeal(existingMealId, updatedFields);
        message.success(`${userName}'s ${mealType} updated!`);
      } else {
        const docRef = doc(collection(db, "meals"));
        await setDoc(docRef, {
          messId: messId,
          userId: userId,
          userName: userName,
          date: currentDate,
          breakfast: mealType === "breakfast" ? checked : false,
          lunch: mealType === "lunch" ? checked : false,
          dinner: mealType === "dinner" ? checked : false,
          guestMeals: record.meals.guestMeals || 0,
          createdAt: Timestamp.now(),
        } as Omit<Meal, "id">);

        message.success(`${userName}'s meal record created!`);
      }
    } catch (error) {
      console.error("Meal update failed:", error);
      message.error(`Failed to update meal: ${(error as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getDisabledState = (record: any) =>
    isUpdating || (!isManager && record.user.uid !== currentUser.uid);

  const calculateDailyTotal = (meals: any) =>
    (meals.breakfast ? 1 : 0) +
    (meals.lunch ? 1 : 0) +
    (meals.dinner ? 1 : 0) +
    (meals.guestMeals || 0);

  const mobileColumns = [
    {
      title: "Member",
      dataIndex: ["user", "displayName"],
      key: "displayName",
      width: 70,
      render: (_: string, record: any) => (
        <div
          style={{ fontSize: "11px", lineHeight: "1.2", color: PRIMARY_COLOR }}
        >
          {record.user.displayName.length > 6
            ? `${record.user.displayName.substring(0, 6)}...`
            : record.user.displayName}
          {record.user.uid === currentUser.uid && " (You)"}
        </div>
      ),
    },
    {
      title: "B/F",
      dataIndex: ["meals", "breakfast"],
      key: "breakfast",
      align: "center" as const,
      width: 40,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleMealToggle(record, "breakfast", e.target.checked)
          }
          disabled={getDisabledState(record)}
          style={{ transform: "scale(0.8)" }}
        />
      ),
    },
    {
      title: "Lunch",
      dataIndex: ["meals", "lunch"],
      key: "lunch",
      align: "center" as const,
      width: 40,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleMealToggle(record, "lunch", e.target.checked)}
          disabled={getDisabledState(record)}
          style={{ transform: "scale(0.8)" }}
        />
      ),
    },
    {
      title: "Dinner",
      dataIndex: ["meals", "dinner"],
      key: "dinner",
      align: "center" as const,
      width: 40,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleMealToggle(record, "dinner", e.target.checked)}
          disabled={getDisabledState(record)}
          style={{ transform: "scale(0.8)" }}
        />
      ),
    },
    {
      title: "Guest",
      dataIndex: ["meals", "guestMeals"],
      key: "guestMeals",
      align: "center" as const,
      width: 50,
      render: (value: number, record: any) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => handleGuestMealChange(record, val)}
          onBlur={(e) => {
            handleGuestMealChange(record, parseFloat(e.target.value));
          }}
          style={{ width: "45px", fontSize: "11px", padding: "1px" }}
          disabled={getDisabledState(record)}
          size="small"
        />
      ),
    },
    {
      title: "Daily Total",
      key: "dailyTotal",
      align: "center" as const,
      width: 50,
      render: (_: any, record: any) => (
        <Text strong style={{ fontSize: "11px", color: PRIMARY_COLOR }}>
          {calculateDailyTotal(record.meals)}
        </Text>
      ),
    },
    {
      title: "M.Total",
      dataIndex: "monthlyTotalMeals",
      key: "monthlyTotalMeals",
      align: "center" as const,
      width: 40,
      render: (value: number, record: any) => {
        if (isManager || record.user.uid === currentUser.uid) {
          return (
            <Text strong style={{ fontSize: "11px", color: PRIMARY_COLOR }}>
              {value}
            </Text>
          );
        }
        return (
          <Text type="secondary" style={{ fontSize: "11px" }}>
            N/A
          </Text>
        );
      },
    },
  ];

  const desktopColumns = [
    {
      title: "Member",
      dataIndex: ["user", "displayName"],
      key: "displayName",
      width: 120,
      render: (_: string, record: any) => (
        <Text
          strong={record.user.uid === currentUser.uid}
          style={{ color: PRIMARY_COLOR }}
        >
          {record.user.displayName}{" "}
          {record.user.uid === currentUser.uid && "(You)"}
        </Text>
      ),
    },
    {
      title: "Role",
      dataIndex: ["user", "role"],
      key: "role",
      width: 80,
      render: (role: string) => (
        <Text
          strong
          style={{
            color: role === "manager" ? ACCENT_COLOR_WARNING : "inherit",
          }}
        >
          {role.toUpperCase()}
        </Text>
      ),
    },
    {
      title: "Breakfast",
      dataIndex: ["meals", "breakfast"],
      key: "breakfast",
      align: "center" as const,
      width: 90,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleMealToggle(record, "breakfast", e.target.checked)
          }
          disabled={getDisabledState(record)}
        />
      ),
    },
    {
      title: "Lunch",
      dataIndex: ["meals", "lunch"],
      key: "lunch",
      align: "center" as const,
      width: 90,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleMealToggle(record, "lunch", e.target.checked)}
          disabled={getDisabledState(record)}
        />
      ),
    },
    {
      title: "Dinner",
      dataIndex: ["meals", "dinner"],
      key: "dinner",
      align: "center" as const,
      width: 90,
      render: (value: boolean, record: any) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleMealToggle(record, "dinner", e.target.checked)}
          disabled={getDisabledState(record)}
        />
      ),
    },
    {
      title: "Guest Meals",
      dataIndex: ["meals", "guestMeals"],
      key: "guestMeals",
      align: "center" as const,
      width: 100,
      render: (value: number, record: any) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => handleGuestMealChange(record, val)}
          onBlur={(e) => {
            handleGuestMealChange(record, parseFloat(e.target.value));
          }}
          style={{ width: "80px", padding: "2px" }}
          disabled={getDisabledState(record)}
        />
      ),
    },
    {
      title: "Daily Total",
      key: "dailyTotal",
      align: "center" as const,
      width: 90,
      render: (_: any, record: any) => (
        <Text strong style={{ color: PRIMARY_COLOR }}>
          {calculateDailyTotal(record.meals)}
        </Text>
      ),
    },
    {
      title: "Monthly Total",
      dataIndex: "monthlyTotalMeals",
      key: "monthlyTotalMeals",
      align: "center" as const,
      width: 100,
      render: (value: number, record: any) => {
        if (isManager || record.user.uid === currentUser.uid) {
          return (
            <Text strong style={{ color: PRIMARY_COLOR }}>
              {value}
            </Text>
          );
        }
        return <Text type="secondary">N/A</Text>;
      },
    },
  ];

  const columns = isMobile ? mobileColumns : desktopColumns;

  const allMembersList = useMemo(
    () =>
      userMealData.map((data) => ({
        uid: data.user.uid,
        displayName: data.user.displayName,
      })),
    [userMealData]
  );

  return (
    <div style={{ padding: isMobile ? "8px" : "20px" }}>
      <Card
        title={
          <Title
            level={isMobile ? 5 : 4}
            style={{
              margin: 0,
              fontSize: isMobile ? "16px" : "18px",
              color: PRIMARY_COLOR,
            }}
          >
            🍚 Daily Meal Tracker
          </Title>
        }
        extra={
          <Text
            type="secondary"
            style={{ fontSize: isMobile ? "12px" : "14px" }}
          >
            Date: {formattedDate}
          </Text>
        }
        style={{ marginBottom: 16 }}
        size={isMobile ? "small" : "default"}
      >
        <Table
          dataSource={userMealData}
          columns={columns}
          rowKey={(record) => record.user.uid}
          loading={loading || isUpdating}
          pagination={false}
          bordered
          size={isMobile ? "small" : "middle"}
          scroll={isMobile ? { x: 400 } : { x: "max-content" }}
          style={{ border: `1px solid ${PRIMARY_COLOR}33` }}
        />
        {(loading || isUpdating) && (
          <Spin tip="Loading real-time data..." style={{ marginTop: 16 }} />
        )}
      </Card>

      <Divider style={{ margin: "16px 0", borderColor: PRIMARY_COLOR }} />

      <MonthlyBillingSummary
        userMealData={userMealData}
        billingSummary={billingSummary}
        loading={loading}
      />

      <Divider style={{ margin: "16px 0", borderColor: PRIMARY_COLOR }} />

      <MonthlyMealHistory
        messId={messId}
        allMembers={allMembersList}
        isManager={isManager}
      />

      <style jsx global>{`
        @media (max-width: 768px) {
          .ant-table-cell {
            padding: 6px 4px !important;
          }

          .ant-checkbox-inner {
            width: 14px;
            height: 14px;
          }

          .ant-input-number-input {
            padding: 0 4px;
            font-size: 11px;
          }
          .ant-card-head-extra {
            padding: 12px 0;
          }
          .ant-card-body {
            padding: 12px !important;
          }
        }

        @media (min-width: 769px) {
          .ant-table-wrapper .ant-table-thead > tr > th {
            padding: 14px 12px !important;
            font-size: 16px !important;
            color: #fff;
            background-color: ${PRIMARY_COLOR} !important;
            border-right-color: #00000033 !important;
          }

          .ant-table-wrapper .ant-table-thead > tr > th .ant-typography {
            color: #fff !important;
            font-size: 16px !important;
          }

          .ant-table-wrapper .ant-table-tbody > tr > td {
            padding: 14px 12px !important;
            font-size: 16px !important;
          }

          .ant-typography,
          .ant-select-selection-item,
          .ant-input-number-input {
            font-size: 16px !important;
          }

          .ant-card-body .ant-row .ant-col .ant-typography {
            font-size: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .ant-card-head-title {
            font-size: 14px !important;
          }

          .ant-divider {
            margin: 12px 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MealTracker;

import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { useAuth } from "../../lib/auth-context";
import type { Meal, UserProfile } from "../../lib/types";

import Dayjs from "dayjs";

// --- Interfaces ---
interface MealData extends Meal {
  id: string;
}

interface GroceryPurchaseData {
  totalCost: number;
  date: any; // Firestore Timestamp
  boughtById: string;
}

interface UserMealData {
  user: Pick<UserProfile, "uid" | "displayName" | "role">;
  meals: Partial<MealData>;
  monthlyTotalMeals: number;
  monthlyTotalPaid: number;
}

interface BillingSummary {
  totalMeals: number;
  totalGroceryCost: number;
  mealRate: number;
}

// --- Date Helpers (YYYY-MM-DD) ---
const getMonthStartString = (): string =>
  Dayjs().startOf("month").format("YYYY-MM-DD");
const getMonthEndString = (): string =>
  Dayjs().endOf("month").format("YYYY-MM-DD");
const getCurrentDateString = (): string => Dayjs().format("YYYY-MM-DD");

// --- Hook Definition ---
export const useMealTracking = () => {
  const { user } = useAuth();
  const [userMealData, setUserMealData] = useState<UserMealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(getCurrentDateString());
  const [billingSummary, setBillingSummary] = useState<BillingSummary>({
    totalMeals: 0,
    totalGroceryCost: 0,
    mealRate: 0,
  });
  const messId = user?.messId;

  useEffect(() => {
    if (!messId) {
      setUserMealData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes: (() => void)[] = [];

    let currentMembers: UserProfile[] = [];
    let dailyMeals: MealData[] = [];
    let monthlyMeals: MealData[] = [];
    let monthlyGroceryPurchases: GroceryPurchaseData[] = [];

    const monthStartString = getMonthStartString();
    const monthEndString = getMonthEndString();

    const calculateTotalPaidByMember = (
      purchases: GroceryPurchaseData[]
    ): Map<string, number> => {
      const paidMap = new Map<string, number>();
      purchases.forEach((purchase) => {
        const currentTotal = paidMap.get(purchase.boughtById) || 0;
        paidMap.set(purchase.boughtById, currentTotal + purchase.totalCost);
      });
      return paidMap;
    };

    const calculateMonthlyTotal = (userId: string): number => {
      return monthlyMeals
        .filter((meal) => meal.userId === userId)
        .reduce(
          (total, meal) =>
            total +
            (meal.breakfast ? 1 : 0) +
            (meal.lunch ? 1 : 0) +
            (meal.dinner ? 1 : 0),
          0
        );
    };

    const combineData = () => {
      const overallTotalMeals = monthlyMeals.reduce(
        (total, meal) =>
          total +
          (meal.breakfast ? 1 : 0) +
          (meal.lunch ? 1 : 0) +
          (meal.dinner ? 1 : 0),
        0
      );

      const overallTotalGroceryCost = monthlyGroceryPurchases.reduce(
        (sum, purchase) => sum + purchase.totalCost,
        0
      );

      const rate =
        overallTotalMeals > 0
          ? parseFloat((overallTotalGroceryCost / overallTotalMeals).toFixed(2))
          : 0;

      const memberPaidMap = calculateTotalPaidByMember(monthlyGroceryPurchases);

      setBillingSummary({
        totalMeals: overallTotalMeals,
        totalGroceryCost: overallTotalGroceryCost,
        mealRate: rate,
      });

      if (currentMembers.length === 0) {
        if (!loading) setUserMealData([]);
        return;
      }

      const dailyMealsMap = new Map<string, MealData>();
      dailyMeals.forEach((meal) => {
        dailyMealsMap.set(meal.userId, meal);
      });

      const combinedList: UserMealData[] = currentMembers.map((memberData) => {
        const mealRecord = dailyMealsMap.get(memberData.uid);

        const defaultMeal = {
          userId: memberData.uid,
          messId: messId,
          date: currentDate,
          breakfast: false,
          lunch: false,
          dinner: false,
        };

        return {
          user: {
            uid: memberData.uid,
            displayName: memberData.displayName || "Unknown User",
            role: memberData.role || "member",
          },
          meals: mealRecord || defaultMeal,
          monthlyTotalMeals: calculateMonthlyTotal(memberData.uid),
          monthlyTotalPaid: memberPaidMap.get(memberData.uid) || 0,
        };
      });

      combinedList.sort((a, b) => {
        if (a.user.role === "manager" && b.user.role !== "manager") return -1;
        if (a.user.role !== "manager" && b.user.role === "manager") return 1;
        return a.user.displayName.localeCompare(b.user.displayName);
      });

      setUserMealData(combinedList);
      setLoading(false);
    };

    // ১. মেম্বারদের তথ্য আনা (users collection)
    const membersQuery = query(
      collection(db, "users"),
      where("messId", "==", messId)
    );
    unsubscribes.push(
      onSnapshot(membersQuery, (snapshot) => {
        currentMembers = snapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
        );
        combineData();
      })
    );

    // ২. আজকের দিনের খাবারের তথ্য আনা (meals collection)
    const dailyMealQuery = query(
      collection(db, "meals"),
      where("messId", "==", messId),
      where("date", "==", currentDate)
    );
    unsubscribes.push(
      onSnapshot(dailyMealQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        dailyMeals = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MealData)
        );
        combineData();
      })
    );

    // ৩. বর্তমান মাসের মোট খাবারের তথ্য আনা (meals collection)
    const monthlyMealQuery = query(
      collection(db, "meals"),
      where("messId", "==", messId),
      where("date", ">=", monthStartString),
      where("date", "<=", monthEndString)
    );
    unsubscribes.push(
      onSnapshot(
        monthlyMealQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          monthlyMeals = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as MealData)
          );
          combineData();
        },
        (error) => {
          console.error("Error fetching monthly meal data:", error);
        }
      )
    );

    // ৪. বর্তমান মাসের মোট গ্রোসারি খরচ আনা (grocery collection)
    const groceryQuery = query(
      collection(db, "grocery"),
      where("messId", "==", messId)
    );

    unsubscribes.push(
      onSnapshot(
        groceryQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const startOfMonth = Dayjs(monthStartString);
          const endOfMonth = Dayjs(monthEndString);

          monthlyGroceryPurchases = snapshot.docs
            .map((doc) => ({ ...doc.data() } as GroceryPurchaseData))
            .filter((purchase) => {
              // FIX: purchase.date এর সেফটি চেক
              if (
                !purchase.date ||
                typeof purchase.date.toDate !== "function"
              ) {
                return false;
              }

              const purchaseDate = Dayjs(purchase.date.toDate());

              return (
                purchaseDate.isAfter(startOfMonth.subtract(1, "day")) &&
                purchaseDate.isBefore(endOfMonth.add(1, "day"))
              );
            });
          combineData();
        },
        (error) => {
          console.error("Error fetching monthly grocery data:", error);
        }
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId, currentDate]);

  return { userMealData, loading, currentDate, messId, billingSummary };
};

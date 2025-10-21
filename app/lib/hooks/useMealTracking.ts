import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../auth-context";
import type { Meal, UserProfile } from "../types";

// --- Interfaces ---
interface MealData extends Meal {
  id: string;
}

interface UserMealData {
  user: Pick<UserProfile, "uid" | "displayName" | "role">;
  meals: Partial<MealData>; // The meal record for the current day
  monthlyTotalMeals: number; // Monthly total meal count
}

// --- Date Helpers (Uses ISO String for consistent query) ---

// Helper to get start date string of the current month (e.g., "2025-10-01")
const getMonthStartString = (): string => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // YYYY-MM-DD format
  return startOfMonth.toISOString().split("T")[0];
};

// Helper to get end date string of the current month (e.g., "2025-10-31")
const getMonthEndString = (): string => {
  const now = new Date();
  // Get the last day of the month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return endOfMonth.toISOString().split("T")[0];
};

const getCurrentDateString = (): string =>
  new Date().toISOString().split("T")[0];

// --- Hook Definition ---

export const useMealTracking = () => {
  const { user } = useAuth();
  const [userMealData, setUserMealData] = useState<UserMealData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(getCurrentDateString());
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

    const monthStartString = getMonthStartString();
    const monthEndString = getMonthEndString();

    // Helper to count meals for a user across the month
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
      if (currentMembers.length === 0) {
        // Wait for member list to populate
        // If loading is false and no members exist, show empty state
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
        };
      });

      // Sort by Manager first, then Display Name
      combinedList.sort((a, b) => {
        if (a.user.role === "manager" && b.user.role !== "manager") return -1;
        if (a.user.role !== "manager" && b.user.role === "manager") return 1;
        return a.user.displayName.localeCompare(b.user.displayName);
      });

      setUserMealData(combinedList);
      setLoading(false);
    };

    // 1. Members Listener (Real-time)
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

    // 2. Daily Meals Listener (Real-time - for today's checkboxes)
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

    // 3. Monthly Meals Listener (FIXED: Uses ISO Strings for range query)
    const monthlyMealQuery = query(
      collection(db, "meals"),
      where("messId", "==", messId),
      // FIX: Using ISO string range query
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

    // Cleanup function
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [messId, currentDate]);

  return { userMealData, loading, currentDate, messId };
};


import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";

interface Expense {
  amount: number;
  name: string;
  icon: string;
  percentage?: number;
  previousAmount?: number;
}

interface ExpenseCategory extends Expense {
  change: number;
}

interface FinanceContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  expenses: {
    month: string;
    total: number;
    previousTotal: number | null;
    change: number;
    categories: ExpenseCategory[];
    investedAmount: number;
    selectedMonth: string;
    availableMonths: string[];
  };
  setSelectedMonth: (month: string) => void;
  isLoading: boolean;
  error: string | null;
}

const defaultFinanceContext: FinanceContextType = {
  activeTab: "expense",
  setActiveTab: () => {},
  expenses: {
    month: "May 2025",
    total: 0,
    previousTotal: 0,
    change: 0,
    categories: [],
    investedAmount: 0,
    selectedMonth: new Date().toISOString().slice(0, 7),
    availableMonths: [],
  },
  setSelectedMonth: () => {},
  isLoading: false,
  error: null,
};

const FinanceContext = createContext<FinanceContextType>(defaultFinanceContext);

// Mapping for MCC codes to categories
const mccToCategory: { [key: string]: { name: string; icon: string } } = {
  "5411": { name: "Groceries", icon: "shopping-bag" },
  "5812": { name: "Restaurants", icon: "utensils" },
  "4111": { name: "Transport", icon: "car" },
  "5813": { name: "Entertainment", icon: "music" },
  "6513": { name: "Rent", icon: "home" },
  "5192": { name: "Books", icon: "book" },
  "5977": { name: "Cosmetics", icon: "shopping-bag" },
  "6211": { name: "Investments", icon: "trending-up" },
  "default": { name: "Other", icon: "shopping-bag" },
};

// Function to format date to month and year (e.g., "May 2025")
const formatMonthYear = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState("expense");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Format: "2025-05"
  const [expenses, setExpenses] = useState(defaultFinanceContext.expenses);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Fetch expense data from Supabase
  useEffect(() => {
    const fetchExpenseData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get available months first
        const { data: monthsData, error: monthsError } = await supabase
          .from('banking_sample_data')
          .select('bookingDate')
          .eq('userId', '25e3564c-8bb9-4fdd-9dd7-cf0ec8c54c28')
          .order('bookingDate', { ascending: false });
        
        if (monthsError) throw new Error(monthsError.message);
        
        // Extract unique months
        const months = Array.from(new Set(
          monthsData
            .map(item => item.bookingDate ? item.bookingDate.slice(0, 7) : null)
            .filter(Boolean)
        ));
        
        setAvailableMonths(months);
        
        // If no selected month yet and we have data, select the most recent
        if (months.length > 0 && (!selectedMonth || !months.includes(selectedMonth))) {
          setSelectedMonth(months[0]);
        }
        
        // Get current month data
        const currentMonthStart = `${selectedMonth}-01`;
        const nextMonth = new Date(selectedMonth.slice(0, 4), parseInt(selectedMonth.slice(5, 7)), 1);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const currentMonthEnd = nextMonth.toISOString().slice(0, 10);
        
        // Get previous month data for comparison
        const prevMonth = new Date(selectedMonth.slice(0, 4), parseInt(selectedMonth.slice(5, 7)) - 2, 1);
        const prevMonthStart = prevMonth.toISOString().slice(0, 10);
        const prevMonthEnd = `${selectedMonth}-01`;

        // Fetch current month expenses
        const { data: currentData, error: currentError } = await supabase
          .from('banking_sample_data')
          .select('*')
          .eq('userId', '25e3564c-8bb9-4fdd-9dd7-cf0ec8c54c28')
          .eq('side', 'debt')
          .gte('bookingDate', currentMonthStart)
          .lt('bookingDate', currentMonthEnd);
        
        if (currentError) throw new Error(currentError.message);
        
        // Fetch previous month expenses
        const { data: prevData, error: prevError } = await supabase
          .from('banking_sample_data')
          .select('*')
          .eq('userId', '25e3564c-8bb9-4fdd-9dd7-cf0ec8c54c28')
          .eq('side', 'debt')
          .gte('bookingDate', prevMonthStart)
          .lt('bookingDate', prevMonthEnd);
          
        if (prevError) throw new Error(prevError.message);
        
        // Process data
        const categoryTotals: { [key: string]: number } = {};
        const prevCategoryTotals: { [key: string]: number } = {};
        
        // Calculate current month category totals
        let investedAmount = 0;
        let totalExpense = 0;
        
        currentData.forEach(transaction => {
          const amount = Math.abs(transaction.amount || 0);
          totalExpense += amount;
          
          // Get category based on MCC code
          const categoryInfo = mccToCategory[transaction.mcc] || mccToCategory.default;
          const categoryName = categoryInfo.name;
          
          // Track investments separately
          if (categoryName === "Investments") {
            investedAmount += amount;
          }
          
          // Add to category total
          if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = 0;
          }
          categoryTotals[categoryName] += amount;
        });
        
        // Calculate previous month category totals
        let prevTotalExpense = 0;
        
        prevData.forEach(transaction => {
          const amount = Math.abs(transaction.amount || 0);
          prevTotalExpense += amount;
          
          const categoryInfo = mccToCategory[transaction.mcc] || mccToCategory.default;
          const categoryName = categoryInfo.name;
          
          if (!prevCategoryTotals[categoryName]) {
            prevCategoryTotals[categoryName] = 0;
          }
          prevCategoryTotals[categoryName] += amount;
        });
        
        // Calculate percentage changes and format categories
        const formattedCategories = Object.keys(categoryTotals).map(category => {
          const prevAmount = prevCategoryTotals[category] || 0;
          const currentAmount = categoryTotals[category];
          let change = 0;
          
          if (prevAmount > 0) {
            change = ((currentAmount - prevAmount) / prevAmount) * 100;
          }
          
          return {
            name: category,
            amount: Math.round(currentAmount),
            icon: (mccToCategory[category] || mccToCategory.default).icon,
            previousAmount: Math.round(prevAmount),
            change: Math.round(change * 10) / 10, // Round to 1 decimal place
            percentage: (currentAmount / totalExpense) * 100
          };
        });
        
        // Calculate overall change
        let overallChange = 0;
        if (prevTotalExpense > 0) {
          overallChange = ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100;
        }
        
        // Sort categories by amount (highest first)
        formattedCategories.sort((a, b) => b.amount - a.amount);
        
        setExpenses({
          month: formatMonthYear(`${selectedMonth}-01`),
          total: Math.round(totalExpense),
          previousTotal: Math.round(prevTotalExpense),
          change: Math.round(overallChange * 10) / 10,
          categories: formattedCategories,
          investedAmount: Math.round(investedAmount),
          selectedMonth: selectedMonth,
          availableMonths: months,
        });
        
      } catch (err: any) {
        console.error("Error fetching expense data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExpenseData();
  }, [selectedMonth]);

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        expenses,
        setSelectedMonth,
        isLoading,
        error
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);

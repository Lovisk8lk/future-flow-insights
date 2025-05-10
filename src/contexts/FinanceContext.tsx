
import React, { createContext, useState, useContext, ReactNode } from "react";

type FinanceContextType = {
  retirementData: {
    monthlyDeposit: number;
    growthRate: number;
    depositGrowthRate: number;
    marketRate: number;
    retirementYearlyAmount: number;
    retirementGrowthRate: number;
    retirementStartYear: number;
    portfolioValue: number[];
    savingsRate: number[];
    retirementDuration?: number; // Added new parameter
  };
  updateRetirementData: (data: Partial<FinanceContextType["retirementData"]>) => void;
  expenses: {
    month: string;
    categories: {
      name: string;
      icon: string;
      amount: number;
    }[];
  };
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const defaultContext: FinanceContextType = {
  retirementData: {
    monthlyDeposit: 300,
    growthRate: 3,
    depositGrowthRate: 1,
    marketRate: 4,
    retirementYearlyAmount: 24000,
    retirementGrowthRate: 2,
    retirementStartYear: 2053,
    portfolioValue: Array(40).fill(0).map((_, i) => 50000 + Math.pow(i, 2) * 1000 - (i > 30 ? Math.pow(i - 30, 3) * 300 : 0)),
    savingsRate: Array(40).fill(0).map((_, i) => i < 30 ? 300 - i * 6 : 300 - 30 * 6),
    retirementDuration: 30, // Default to 30 years
  },
  updateRetirementData: () => {},
  expenses: {
    month: "July 2026",
    categories: [
      { name: "Groceries", icon: "shopping-bag", amount: 450 },
      { name: "Rent", icon: "home", amount: 1200 },
      { name: "Transport", icon: "car", amount: 100 },
      { name: "Clubbing", icon: "music", amount: 60 }
    ]
  },
  activeTab: "retirement",
  setActiveTab: () => {},
};

const FinanceContext = createContext<FinanceContextType>(defaultContext);

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [retirementData, setRetirementData] = useState(defaultContext.retirementData);
  const [expenses] = useState(defaultContext.expenses);
  const [activeTab, setActiveTab] = useState(defaultContext.activeTab);

  const updateRetirementData = (data: Partial<FinanceContextType["retirementData"]>) => {
    setRetirementData(prev => ({ ...prev, ...data }));
  };

  return (
    <FinanceContext.Provider 
      value={{ 
        retirementData, 
        updateRetirementData, 
        expenses, 
        activeTab, 
        setActiveTab 
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};


import React from "react";
import { useFinance } from "../contexts/FinanceContext";

const TabNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  return (
    <div className="flex border-b border-gray-200 mb-2">
      <button
        onClick={() => setActiveTab("retirement")}
        className={`px-6 py-3 text-sm font-medium ${
          activeTab === "retirement"
            ? "border-b-2 border-black"
            : "text-gray-500"
        }`}
      >
        Retirement
      </button>
      <button
        onClick={() => setActiveTab("expenses")}
        className={`px-6 py-3 text-sm font-medium ${
          activeTab === "expenses"
            ? "border-b-2 border-black"
            : "text-gray-500"
        }`}
      >
        Expenses
      </button>
      <button
        onClick={() => setActiveTab("aichat")}
        className={`px-6 py-3 text-sm font-medium ${
          activeTab === "aichat"
            ? "border-b-2 border-black"
            : "text-gray-500"
        }`}
      >
        AI Chat
      </button>
    </div>
  );
};

export default TabNavigation;

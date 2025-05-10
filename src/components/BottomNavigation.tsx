
import React from "react";
import { useFinance } from "../contexts/FinanceContext";
import { TrendingUp, DollarSign } from "lucide-react";

const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  return (
    <div className="fixed bottom-0 left-0 right-0 flex bg-white border-t border-gray-200">
      <button
        onClick={() => setActiveTab("retirement")}
        className={`flex flex-1 flex-col items-center justify-center py-3 ${
          activeTab === "retirement" ? "text-black" : "text-gray-500"
        }`}
      >
        <TrendingUp size={20} />
        <span className="text-xs mt-1">Retirement</span>
      </button>
      <button
        onClick={() => setActiveTab("expenses")}
        className={`flex flex-1 flex-col items-center justify-center py-3 ${
          activeTab === "expenses" ? "text-black" : "text-gray-500"
        }`}
      >
        <DollarSign size={20} />
        <span className="text-xs mt-1">Expenses</span>
      </button>
    </div>
  );
};

export default BottomNavigation;

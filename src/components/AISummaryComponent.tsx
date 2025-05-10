
import React from "react";
import { useFinance } from "../contexts/FinanceContext";

const AISummaryComponent: React.FC = () => {
  const { expenses } = useFinance();
  
  // Generate AI insights based on expense data
  const generateInsight = () => {
    // Find category with highest increase
    const highestIncrease = [...expenses.categories]
      .filter(cat => cat.name.toLowerCase() !== "investments") // exclude investments
      .sort((a, b) => b.change - a.change)[0];
    
    if (highestIncrease && highestIncrease.change > 5) {
      return `Your ${highestIncrease.name.toLowerCase()} spending increased by ${highestIncrease.change}%. Consider setting a limit next month.`;
    }
    
    // If no significant increases, check for good savings
    if (expenses.change < -5) {
      return `Great job! Your overall spending decreased by ${Math.abs(expenses.change)}% compared to last month.`;
    }
    
    // Default message
    return "Your spending patterns are consistent with last month. Keep maintaining your budget.";
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h3 className="text-xl font-bold mb-2">AI Summary</h3>
      <p className="mb-2">{generateInsight()}</p>
      <div className="h-10 mt-2">
        <svg viewBox="0 0 100 20" className="w-full h-full">
          <path 
            d="M0,10 Q10,15 20,7 T40,10 T60,5 T80,12 T100,8" 
            fill="none" 
            stroke="#4097FF" 
            strokeWidth="2" 
          />
        </svg>
      </div>
    </div>
  );
};

export default AISummaryComponent;

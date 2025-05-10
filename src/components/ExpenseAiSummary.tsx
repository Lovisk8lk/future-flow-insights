
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type MonthCategorySummary = {
  month: string;
  monthKey: string;
  totalAmount: number;
  categories: {
    category: string;
    totalAmount: number;
    transactions: any[];
  }[];
};

interface ExpenseAiSummaryProps {
  data: MonthCategorySummary;
  previousMonth: MonthCategorySummary | null;
}

const ExpenseAiSummary: React.FC<ExpenseAiSummaryProps> = ({ data, previousMonth }) => {
  return (
    <Card className="bg-finance-gray rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="flex-shrink-0">
          <div className="bg-black p-2 rounded-md">
            <TradeRepublicAiIcon />
          </div>
        </div>
        <h3 className="text-lg font-semibold">Expense Intelligence</h3>
        </div>
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-4">
          Excellent expense management! Your spending this month shows consistent discipline in major categories.
          {previousMonth && data.totalAmount < previousMonth.totalAmount && 
            " You've reduced your overall expenses compared to last month, showing good financial discipline."}
          {data.categories.length > 0 && 
            ` Your biggest expense category is ${data.categories[0].category}, representing ${(data.categories[0].totalAmount / data.totalAmount * 100).toFixed(0)}% of your total spending.`}
        </p>
        <button className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors">
          Say More
        </button>
      </CardContent>
    </Card>
  );
};

// Custom Trade Republic-style AI icon
const TradeRepublicAiIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 8H20M4 16H20" 
      stroke="white" 
      strokeWidth="3" 
      strokeLinecap="round" 
    />
    <path 
      d="M7 12H17" 
      stroke="white" 
      strokeWidth="3" 
      strokeLinecap="round" 
    />
  </svg>
);

export default ExpenseAiSummary;

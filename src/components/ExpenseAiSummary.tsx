
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  return (
    <>
      <Card className="bg-finance-gray rounded-xl overflow-hidden" id="expense-intelligence-card">
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
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Refine Budget
          </button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-finance-gray border-none max-w-[350px] min-h-[340px]">
          <DialogHeader>
            <DialogTitle>Refine Your Budget</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-xs text-gray-700 mb-3">
              Adjust your monthly budget targets based on AI recommendations.
            </p>
            <div className="space-y-2">
              {data.categories.slice(0, 3).map((category, index) => (
                <div key={index} className="bg-white p-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">{category.category}</h4>
                    <p className="text-xs font-medium">€{Math.round(category.totalAmount * 0.9)}</p>
                  </div>
                  <p className="text-[10px] text-gray-500">-10% from €{category.totalAmount.toFixed(0)}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <button
                className="w-full bg-black text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
              >
                Save Budget Targets
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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


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
        <DialogContent className="bg-finance-gray border-none w-full max-w-none sm:max-w-[calc(100vw-2rem)] md:max-w-[500px] lg:max-w-[550px] min-h-[450px]">
          <DialogHeader>
            <DialogTitle>Refine Your Budget</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">
              Use this tool to adjust your monthly budget targets based on AI recommendations
              and your spending habits.
            </p>
            <div className="mt-4 space-y-2">
              {data.categories.slice(0, 3).map((category, index) => (
                <div key={index} className="bg-white p-3 rounded-lg">
                  <h4 className="font-medium">{category.category}</h4>
                  <p className="text-sm text-gray-500">Current spending: €{category.totalAmount.toFixed(0)}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Your Targets</h4>
              <div className="space-y-2">
                {data.categories.slice(0, 3).map((category, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{category.category}</h4>
                      <p className="text-sm font-medium">€{Math.round(category.totalAmount * 0.9)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Recommended: 10% reduction</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8">
              <button
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
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

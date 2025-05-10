
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAiSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Make a request to our Supabase Edge Function
        const response = await fetch('/.netlify/functions/generate-ai-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch AI summary');
        }
        
        const result = await response.json();
        setAiSummary(result.generatedText);
      } catch (err) {
        console.error('Error fetching AI summary:', err);
        setError('Failed to load AI insights. Using fallback text.');
        // Fallback to the static text
        setAiSummary(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAiSummary();
  }, [data.monthKey]); // Re-fetch when month changes
  
  // Fallback text to use when AI generation fails
  const fallbackText = `Excellent expense management! Your spending this month shows consistent discipline in major categories.
    ${previousMonth && data.totalAmount < previousMonth.totalAmount ? 
      " You've reduced your overall expenses compared to last month, showing good financial discipline." : ""}
    ${data.categories.length > 0 ? 
      ` Your biggest expense category is ${data.categories[0].category}, representing ${(data.categories[0].totalAmount / data.totalAmount * 100).toFixed(0)}% of your total spending.` : ""}`;
  
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
          {isLoading ? (
            <p className="text-sm font-medium mb-4">Loading AI insights...</p>
          ) : (
            <p className="text-sm font-medium mb-4">
              {aiSummary || fallbackText}
            </p>
          )}
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Refine Budget
          </button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-finance-gray border-none max-w-[350px] min-h-[300px] p-3">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-xl">Refine Your Budget</DialogTitle>
          </DialogHeader>
          <div className="py-0">
            <p className="text-sm text-gray-700 mb-2">
              Adjust your monthly budget targets based on AI recommendations.
            </p>
            <div className="space-y-1">
              {/* Netflix Card */}
              <Link to="/subscription/netflix" className="block">
                <div className="bg-white p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-base">Netflix Standard Plan</h4>
                    <p className="text-sm font-medium">€12.99</p>
                  </div>
                  <p className="text-xs text-gray-500">-10% from €14.99</p>
                </div>
              </Link>
              
              {/* Amazon Prime Card */}
              <Link to="/subscription/amazon-prime" className="block">
                <div className="bg-white p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-base">Amazon Prime Subscription</h4>
                    <p className="text-sm font-medium">€7.99</p>
                  </div>
                  <p className="text-xs text-gray-500">-10% from €8.99</p>
                </div>
              </Link>
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

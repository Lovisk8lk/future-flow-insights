
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
  aiSummary: string | null;
  isLoading: boolean;
  transactions?: any[];
}

type Subscription = {
  name: string;
  price: string;
  id: string;
};

const ExpenseAiSummary: React.FC<ExpenseAiSummaryProps> = ({
  data,
  previousMonth,
  aiSummary,
  isLoading,
  transactions = []
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localAiSummary, setLocalAiSummary] = useState<string | null>(aiSummary);
  const [localIsLoading, setLocalIsLoading] = useState<boolean>(isLoading);
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const subscriptions: Subscription[] = [
    { 
      name: "Netflix Standard Plan", 
      price: "€11.99", 
      id: "netflix" 
    },
    { 
      name: "Amazon Prime Subscription", 
      price: "€9.99", 
      id: "amazon-prime" 
    }
  ];
  
  // Cache key to identify unique data combinations
  const getCacheKey = () => {
    const monthKey = data.month;
    const totalAmount = data.totalAmount;
    const categoriesHash = data.categories.map(c => `${c.category}:${c.totalAmount}`).join('|');
    return `ai_summary_${monthKey}_${totalAmount}_${categoriesHash}`;
  };

  // Update AI summary when data changes
  useEffect(() => {
    const updateAiSummary = async () => {
      // Skip if we don't have real data yet or if we're already loading
      if (data.month === 'Current Month' || localIsLoading) return;
      
      // Get cache key for this specific data combination
      const cacheKey = getCacheKey();
      const cachedSummary = sessionStorage.getItem(cacheKey);
      
      // Use cached summary if available and not older than 24 hours
      if (cachedSummary) {
        const timestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
        const summaryAge = timestamp ? Date.now() - parseInt(timestamp) : 0;
        const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (summaryAge < MAX_CACHE_AGE) {
          console.log("Using cached AI summary for this specific data");
          setLocalAiSummary(cachedSummary);
          setLocalIsLoading(false);
          return;
        }
      }
      
      setLocalIsLoading(true);
      try {
        // Call our Supabase Edge Function with the latest data
        const { data: result, error: functionError } = await supabase.functions.invoke('generate-ai-summary', {
          body: {
            monthData: data,
            previousMonth,
            transactions
          }
        });
        
        if (functionError) {
          throw new Error('Failed to fetch AI summary: ' + functionError.message);
        }
        
        // Update with the new AI summary
        if (result.generatedText) {
          setLocalAiSummary(result.generatedText);
          
          // Cache the result with this specific data key
          sessionStorage.setItem(cacheKey, result.generatedText);
          sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
          
          // Also update the general AI summary cache
          sessionStorage.setItem('aiSummary', result.generatedText);
          sessionStorage.setItem('aiSummaryTimestamp', Date.now().toString());
        }
      } catch (err) {
        console.error('Error updating AI summary:', err);
        // Keep using the existing summary, don't show an error
      } finally {
        setLocalIsLoading(false);
      }
    };
    
    // Only update if we have real data and it has changed
    if (data.month !== 'Current Month' && data.totalAmount > 0) {
      updateAiSummary();
    }
  }, [data.month, data.totalAmount, previousMonth, transactions]);
  
  const handleSubscriptionSelect = (id: string) => {
    setSelectedSubscription(id === selectedSubscription ? null : id);
  };
  
  const handleCancel = async () => {
    if (!selectedSubscription || !authorized) return;
    
    const subscription = subscriptions.find(s => s.id === selectedSubscription);
    if (!subscription) return;
    
    setIsCancelling(true);
    
    try {
      const response = await fetch('https://hook.eu2.make.com/662511lnb3alvmcpsryi4oke6wyrj2a7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: subscription.id === 'netflix' ? 'Netflix' : 'Amazon Prime',
          userEmail: 'max.mustermann@mail.com'
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Cancellation request sent for your ${subscription.name}.`,
        });
        
        // Reset state
        setSelectedSubscription(null);
        setAuthorized(false);
        setIsDialogOpen(false);
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to send cancellation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Fallback text to use when AI generation fails
  const fallbackText = `Excellent expense management! Your spending this month shows consistent discipline in major categories.
    ${previousMonth && data.totalAmount < previousMonth.totalAmount ? " You've reduced your overall expenses compared to last month, showing good financial discipline." : ""}
    ${data.categories.length > 0 ? ` Your biggest expense category is ${data.categories[0].category}, representing ${(data.categories[0].totalAmount / data.totalAmount * 100).toFixed(0)}% of your total spending.` : ""}`;

  return <>
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
          {localIsLoading ? <p className="text-sm font-medium mb-4">Loading AI insights...</p> : <p className="text-sm font-medium mb-4">
              {localAiSummary || fallbackText}
            </p>}
          <button onClick={() => setIsDialogOpen(true)} className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors">
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
              Adjust your monthly budget targets based on AI recommendations or cancel subscriptions.
            </p>
            <div className="space-y-1">
              {/* Subscription Cards */}
              {subscriptions.map((subscription) => (
                <div 
                  key={subscription.id}
                  className={`bg-white p-3 rounded-lg cursor-pointer transition-colors ${selectedSubscription === subscription.id ? 'ring-2 ring-black' : 'hover:bg-gray-50'}`}
                  onClick={() => handleSubscriptionSelect(subscription.id)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-base">{subscription.name}</h4>
                    <p className="text-sm font-medium">{subscription.price}</p>
                  </div>
                  <p className="text-xs text-green-600 font-semibold">Worth €30k at Retirement</p>
                </div>
              ))}
              
              {/* Authorization Checkbox */}
              <div className="mt-4 flex items-start space-x-2">
                <Checkbox 
                  id="authorize" 
                  checked={authorized}
                  onCheckedChange={(checked) => setAuthorized(checked === true)} 
                  className="mt-1"
                />
                <label htmlFor="authorize" className="text-xs text-gray-700">
                  I authorize this app to cancel the selected subscriptions on my behalf and confirm I am the account holder.
                </label>
              </div>
              
              {/* Cancel Button */}
              <Button
                onClick={handleCancel}
                disabled={!selectedSubscription || !authorized || isCancelling}
                className="w-full mt-4 bg-black hover:bg-gray-800"
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>;
};

// Custom Trade Republic-style AI icon
const TradeRepublicAiIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8H20M4 16H20" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M7 12H17" stroke="white" strokeWidth="3" strokeLinecap="round" />
  </svg>;

export default ExpenseAiSummary;

import React, { useEffect, useState } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { fetchExpensesByUserId, ExpenseTransaction, groupExpensesByMonthAndCategory, fetchAvailableMonths } from "../utils/expenseUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ExpenseAiSummary from "./ExpenseAiSummary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type MonthOption = {
  year: number;
  month: number;
  label: string;
  value: string;
};

type MonthCategorySummary = {
  month: string;
  monthKey: string;
  totalAmount: number;
  categories: {
    category: string;
    totalAmount: number;
    transactions: ExpenseTransaction[];
  }[];
};

const ExpenseOverviewComponent: React.FC = () => {
  const {
    expenses
  } = useFinance();
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [monthCategoryGroups, setMonthCategoryGroups] = useState<MonthCategorySummary[]>([]);
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [previousMonth, setPreviousMonth] = useState<MonthCategorySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const userId = "9c9fdff3-26d0-485e-9e28-c98e967c8bdb";

  // Preload AI summary as early as possible
  useEffect(() => {
    const preloadAiSummary = async () => {
      // Check if we already have a cached summary in the session
      const cachedSummary = sessionStorage.getItem('aiSummary');
      
      if (cachedSummary) {
        console.log("Using cached AI summary from session storage");
        setAiSummary(cachedSummary);
        setAiLoading(false);
        return;
      }
      
      setAiLoading(true);
      try {
        // Call our Supabase Edge Function
        const { data: result, error: functionError } = await supabase.functions.invoke('generate-ai-summary', {
          body: {
            monthData: { month: "Current Month", totalAmount: 0, categories: [] },
            previousMonth: null,
            transactions: [] // Include empty transactions array for initial load
          }
        });
        
        if (functionError) {
          throw new Error('Failed to fetch AI summary: ' + functionError.message);
        }
        
        // Cache the generated text in session storage
        if (result.generatedText) {
          sessionStorage.setItem('aiSummary', result.generatedText);
          setAiSummary(result.generatedText);
        }
      } catch (err) {
        console.error('Error preloading AI summary:', err);
        toast({
          title: "AI Summary Failed",
          description: "Using fallback text instead",
          variant: "destructive",
        });
        setAiSummary(null);
      } finally {
        setAiLoading(false);
      }
    };
    
    // Start preloading immediately
    preloadAiSummary();
  }, []);

  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);
      // Fetch all expenses for the user
      const data = await fetchExpensesByUserId(userId);
      setTransactions(data);

      // Fetch available months for filtering
      const months = await fetchAvailableMonths(userId);
      setAvailableMonths(months);

      // Set default month to most recent
      if (months.length > 0) {
        setSelectedMonth(months[0].value);
      }

      // Group by Month and then by Category
      const monthCategoryGrouped = groupExpensesByMonthAndCategory(data);
      setMonthCategoryGroups(monthCategoryGrouped);
      setLoading(false);
    };
    loadExpenses();
  }, []);

  useEffect(() => {
    // Find the previous month data for comparison
    if (selectedMonth && monthCategoryGroups.length > 1) {
      // Find the index of the selected month in the array
      const currentMonthIndex = monthCategoryGroups.findIndex(group => {
        const [year, month] = selectedMonth.split('-');
        const monthYearString = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
        return group.month === monthYearString;
      });

      // Get the previous index (which is the previous month chronologically)
      // since monthCategoryGroups is now sorted oldest first
      if (currentMonthIndex >= 0 && currentMonthIndex - 1 >= 0) {
        setPreviousMonth(monthCategoryGroups[currentMonthIndex - 1]);
      } else {
        setPreviousMonth(null);
      }
    }
  }, [selectedMonth, monthCategoryGroups]);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  // Get the percentage change between current and previous month
  const getPercentageChange = (currentAmount: number, previousAmount: number | undefined) => {
    if (!previousAmount || previousAmount === 0) return null;
    const change = (currentAmount - previousAmount) / previousAmount * 100;
    return change.toFixed(1);
  };

  // Get percentage change color
  const getChangeColor = (change: number) => {
    if (change > 0) return "text-red-500";
    if (change < 0) return "text-green-500";
    return "text-gray-500";
  };

  // Find category in previous month
  const findPreviousMonthCategory = (categoryName: string) => {
    if (!previousMonth) return null;
    return previousMonth.categories.find(cat => cat.category === categoryName);
  };

  // Calculate total percentage change between months
  const calculateTotalChange = () => {
    if (!previousMonth || !filteredMonthData) return null;
    const change = (filteredMonthData.totalAmount - previousMonth.totalAmount) / previousMonth.totalAmount * 100;
    return change.toFixed(1);
  };

  // Filter expenses by selected month
  const filteredMonthData = selectedMonth ? monthCategoryGroups.find(monthGroup => {
    const [year, month] = selectedMonth.split('-');
    const monthYearString = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
    return monthGroup.month === monthYearString;
  }) : monthCategoryGroups[monthCategoryGroups.length - 1]; // Get the most recent month (now at the end of the array)

  // Get filtered transactions for the selected month
  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction.bookingDate || !selectedMonth) return false;
    const transDate = new Date(transaction.bookingDate);
    const [year, month] = selectedMonth.split('-');
    const selectedYearValue = parseInt(year);
    const selectedMonthValue = parseInt(month) - 1; // JavaScript months are 0-indexed
    
    return transDate.getFullYear() === selectedYearValue && transDate.getMonth() === selectedMonthValue;
  });

  return <div className="flex flex-col px-5 py-4">
      {/* Month Filter Selector */}
      <div className="mb-6">
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(monthOption => <SelectItem key={monthOption.value} value={monthOption.value}>
                {monthOption.label}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      
      {loading ? <div className="text-center py-4">Loading expenses data...</div> : <>
          {filteredMonthData ? <div className="space-y-4">
              <div>
                <h2 className="text-4xl font-bold mb-2">{filteredMonthData.month}</h2>
                <div className="flex items-baseline gap-3 mb-6">
                  <h3 className="font-bold text-lg">
                    Total Expenses: €{filteredMonthData.totalAmount.toFixed(0)}
                  </h3>
                  <div className="text-right">
                  {previousMonth && <span className={`text-lg ${getChangeColor(parseFloat(calculateTotalChange() || "0"))}`}>
                      {parseFloat(calculateTotalChange() || "0") > 0 ? "+" : ""}
                      {calculateTotalChange()}% MoM
                    </span>}
                  </div>
                </div>
                
                {/* Add AI Summary component with preloaded data */}
                <ExpenseAiSummary 
                  data={filteredMonthData} 
                  previousMonth={previousMonth}
                  aiSummary={aiSummary}
                  isLoading={aiLoading}
                  transactions={filteredTransactions}
                />
                
                <Card className="overflow-hidden mt-6">
                  {filteredMonthData.categories.map((category, index) => {
              const prevCategory = findPreviousMonthCategory(category.category);
              const percentChange = prevCategory ? getPercentageChange(category.totalAmount, prevCategory.totalAmount) : null;
              return <div key={index} className={`flex items-center p-4 ${index !== filteredMonthData.categories.length - 1 ? "border-b" : ""}`}>
                        <div className="w-1/4 text-md">{category.category}</div>
                        <div className="w-1/2 px-4">
                          <Progress value={category.totalAmount / filteredMonthData.totalAmount * 100} className="h-4 bg-gray-200" />
                        </div>
                        <div className="w-1/4 text-right">
                          <div className="text-md">{category.totalAmount.toFixed(0)} €</div>
                          {percentChange && <div className={getChangeColor(parseFloat(percentChange))}>
                              {parseFloat(percentChange) > 0 ? "+" : ""}
                              {percentChange}%
                            </div>}
                        </div>
                      </div>;
            })}
                </Card>
              </div>
            </div> : <div className="text-center py-4">No data available for the selected month.</div>}
        </>}
    </div>;
};

export default ExpenseOverviewComponent;

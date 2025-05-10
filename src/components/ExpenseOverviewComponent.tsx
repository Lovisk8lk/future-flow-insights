
import React, { useEffect, useState } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { ShoppingBag, Calendar } from "lucide-react";
import { 
  fetchExpensesByUserId, 
  ExpenseTransaction, 
  groupExpensesByMonthAndCategory,
  getMCCCategory,
  fetchAvailableMonths
} from "../utils/expenseUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

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
  const { expenses } = useFinance();
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [monthCategoryGroups, setMonthCategoryGroups] = useState<MonthCategorySummary[]>([]);
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const userId = "25e3564c-8bb9-4fdd-9dd7-cf0ec8c54c28";

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

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  // Filter expenses by selected month
  const filteredMonthData = selectedMonth 
    ? monthCategoryGroups.find(monthGroup => {
        const [year, month] = selectedMonth.split('-');
        const monthYearString = new Date(parseInt(year), parseInt(month) - 1, 1)
          .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return monthGroup.month === monthYearString;
      })
    : monthCategoryGroups[0];

  return (
    <div className="flex flex-col px-5 py-4">
      <h2 className="text-2xl font-bold mb-4">Expense Analysis</h2>
      
      <div className="mb-6">
        {/* Month Filter Selector */}
        <div className="mb-6">
          <label htmlFor="month-select" className="block text-sm font-medium mb-2">
            Select Month
          </label>
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((monthOption) => (
                <SelectItem key={monthOption.value} value={monthOption.value}>
                  {monthOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading expenses data...</div>
        ) : (
          <>
            {filteredMonthData ? (
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h3 className="text-lg font-medium">{filteredMonthData.month}</h3>
                  <p className="text-sm text-gray-600">Total: €{filteredMonthData.totalAmount.toFixed(2)}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>% of Month</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMonthData.categories.map((category, categoryIndex) => (
                      <TableRow key={categoryIndex}>
                        <TableCell>{category.category}</TableCell>
                        <TableCell>€{category.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          {((category.totalAmount / filteredMonthData.totalAmount) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">No data available for the selected month.</div>
            )}
          </>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-xl font-bold mb-2">AI Summary</h3>
        <p className="mb-2">
          {filteredMonthData ? (
            <>
              For {filteredMonthData.month}, your highest spending category was{" "}
              {filteredMonthData.categories[0]?.category || 'N/A'} with €
              {filteredMonthData.categories[0]?.totalAmount.toFixed(2) || 'N/A'}, 
              representing {((filteredMonthData.categories[0]?.totalAmount / filteredMonthData.totalAmount) * 100).toFixed(1)}% 
              of your monthly expenses.
            </>
          ) : (
            'Select a month to view your expense breakdown by category.'
          )}
        </p>
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
    </div>
  );
};

export default ExpenseOverviewComponent;

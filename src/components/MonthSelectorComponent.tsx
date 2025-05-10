
import React from "react";
import { useFinance } from "../contexts/FinanceContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const MonthSelectorComponent: React.FC = () => {
  const { expenses, setSelectedMonth } = useFinance();
  
  // Format month for display (e.g., "2025-05" to "May 2025")
  const formatMonthDisplay = (monthStr: string) => {
    const date = new Date(`${monthStr}-01`);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="mb-4">
      <Select
        value={expenses.selectedMonth}
        onValueChange={(value) => setSelectedMonth(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={formatMonthDisplay(expenses.selectedMonth)} />
        </SelectTrigger>
        <SelectContent>
          {expenses.availableMonths.map((month) => (
            <SelectItem key={month} value={month}>
              {formatMonthDisplay(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelectorComponent;

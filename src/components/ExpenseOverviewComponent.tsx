
import React from "react";
import { useFinance } from "../contexts/FinanceContext";
import MonthSelectorComponent from "./MonthSelectorComponent";
import ExpenseCategoryRowComponent from "./ExpenseCategoryRowComponent";
import AISummaryComponent from "./AISummaryComponent";

const ExpenseOverviewComponent: React.FC = () => {
  const { expenses, isLoading, error } = useFinance();

  if (isLoading) {
    return (
      <div className="flex flex-col px-5 py-4">
        <p className="text-center py-10">Loading expense data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col px-5 py-4">
        <p className="text-center py-10 text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 py-4">
      <h2 className="text-4xl font-bold mb-2">Expenses</h2>
      <MonthSelectorComponent />
      
      <h3 className="text-3xl font-bold text-gray-400 mb-8">{expenses.month}</h3>
      
      <div className="mb-6">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-3xl font-bold">
            Total Expenses: €{expenses.total.toLocaleString('de-DE')}
          </h2>
          <div className={`text-xl ${expenses.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {expenses.change > 0 ? '+' : ''}
            {expenses.change}% vs last month
          </div>
        </div>

        {expenses.investedAmount > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-700">
              Invested this month: €{expenses.investedAmount.toLocaleString('de-DE')}
            </h3>
          </div>
        )}

        <AISummaryComponent />
      </div>
      
      <div className="mb-6">
        {expenses.categories.map((category, index) => (
          <ExpenseCategoryRowComponent
            key={index}
            name={category.name}
            amount={category.amount}
            icon={category.icon}
            change={category.change}
            percentage={category.percentage || 0}
          />
        ))}
      </div>
    </div>
  );
};

export default ExpenseOverviewComponent;

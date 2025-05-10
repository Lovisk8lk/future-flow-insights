
import React from "react";
import { useFinance } from "../contexts/FinanceContext";
import { ShoppingBag, Home, Car, Music } from "lucide-react";

const ExpenseOverviewComponent: React.FC = () => {
  const { expenses } = useFinance();

  // Map icon names to components
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "shopping-bag":
        return <ShoppingBag size={20} />;
      case "home":
        return <Home size={20} />;
      case "car":
        return <Car size={20} />;
      case "music":
        return <Music size={20} />;
      default:
        return <ShoppingBag size={20} />;
    }
  };

  return (
    <div className="flex flex-col px-5 py-4">
      <h2 className="text-2xl font-bold mb-4">Expense Analysis</h2>
      
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4">{expenses.month}</h3>
        
        {expenses.categories.map((category, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between py-4 border-b border-gray-100"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center mr-3">
                {getIcon(category.icon)}
              </div>
              <span className="font-medium">{category.name}</span>
            </div>
            <span className="font-bold">
              €{category.amount}
            </span>
          </div>
        ))}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-xl font-bold mb-2">AI Summary</h3>
        <p className="mb-2">
          Your savings rate has not changed since last month. Avoid dining out to increase it.
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

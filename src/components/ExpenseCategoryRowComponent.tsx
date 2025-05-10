
import React from "react";
import { ArrowUp, ArrowDown, Minus, ShoppingBag, Home, Car, Music, BookOpen, TrendingUp } from "lucide-react";

interface ExpenseCategoryRowProps {
  name: string;
  amount: number;
  icon: string;
  change: number;
  percentage: number;
}

const ExpenseCategoryRowComponent: React.FC<ExpenseCategoryRowProps> = ({ 
  name, 
  amount, 
  icon, 
  change,
  percentage 
}) => {
  // Determine if the change is positive, negative, or neutral
  // For investments, we want positive change to be green (opposite logic)
  const isInvestment = name.toLowerCase() === "investments";
  
  let changeColor = "text-gray-500"; // neutral
  let ChangeIcon = Minus;
  
  if (Math.abs(change) > 5) {
    if ((change > 0 && !isInvestment) || (change < 0 && isInvestment)) {
      changeColor = "text-red-500";
      ChangeIcon = ArrowUp;
    } else if ((change < 0 && !isInvestment) || (change > 0 && isInvestment)) {
      changeColor = "text-green-500";
      ChangeIcon = ArrowDown;
    }
  }

  // Get the appropriate icon
  const getIcon = () => {
    switch (icon.toLowerCase()) {
      case "shopping-bag": return <ShoppingBag size={20} />;
      case "home": return <Home size={20} />;
      case "car": return <Car size={20} />;
      case "music": return <Music size={20} />;
      case "book": return <BookOpen size={20} />;
      case "trending-up": return <TrendingUp size={20} />;
      default: return <ShoppingBag size={20} />;
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
      <div className="flex items-center">
        <div className="w-8 h-8 flex items-center justify-center mr-3">
          {getIcon()}
        </div>
        <span className="font-medium">{name}</span>
      </div>
      
      <div className="flex-1 mx-4">
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gray-300 rounded-full"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-bold">{amount.toLocaleString('de-DE')} €</div>
        <div className={`flex items-center justify-end ${changeColor}`}>
          <ChangeIcon size={14} className="mr-1" />
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategoryRowComponent;

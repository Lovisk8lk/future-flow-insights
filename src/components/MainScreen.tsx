
import React from "react";
import { useFinance } from "../contexts/FinanceContext";
import TabNavigation from "./TabNavigation";
import RetirementProjectionComponent from "./RetirementProjectionComponent";
import ExpenseOverviewComponent from "./ExpenseOverviewComponent";
import BottomNavigation from "./BottomNavigation";

const MainScreen: React.FC = () => {
  const { activeTab } = useFinance();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="p-5">
        <h1 className="text-3xl font-bold">
          {activeTab === "retirement" ? "Analytics" : "Expense Analysis"}
        </h1>
        <TabNavigation />
      </header>
      
      <main className="flex-1 overflow-auto pb-20">
        {activeTab === "retirement" ? (
          <RetirementProjectionComponent />
        ) : (
          <ExpenseOverviewComponent />
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default MainScreen;

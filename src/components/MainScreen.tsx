
import React from "react";
import { useFinance } from "../contexts/FinanceContext";
import TabNavigation from "./TabNavigation";
import RetirementProjectionComponent from "./RetirementProjectionComponent";
import ExpenseOverviewComponent from "./ExpenseOverviewComponent";
import AIChatComponent from "./AIChatComponent";

const MainScreen: React.FC = () => {
  const { activeTab } = useFinance();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="p-5">
        <h1 className="text-3xl font-bold">
          Analytics
        </h1>
        <TabNavigation />
      </header>
      
      <main className="flex-1 overflow-auto pb-20">
        {activeTab === "retirement" ? (
          <RetirementProjectionComponent />
        ) : activeTab === "aichat" ? (
          <AIChatComponent />
        ) : (
          <ExpenseOverviewComponent />
        )}
      </main>
    
    </div>
  );
};

export default MainScreen;


import React from "react";
import { FinanceProvider } from "../contexts/FinanceContext";
import MainScreen from "../components/MainScreen";

const Index = () => {
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto shadow-lg">
      <FinanceProvider>
        <MainScreen />
      </FinanceProvider>
    </div>
  );
};

export default Index;

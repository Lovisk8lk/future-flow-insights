
import React from "react";

const WelcomeScreen: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to your retirement planner</h1>
      <p className="text-gray-600 mb-8">
        This tool helps you plan your financial future by forecasting your retirement savings.
      </p>
      <img 
        src="/placeholder.svg" 
        alt="Retirement Planning Illustration" 
        className="max-w-[200px] mx-auto mb-8"
      />
    </div>
  );
};

export default WelcomeScreen;

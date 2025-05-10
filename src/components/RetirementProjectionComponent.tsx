
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useFinance } from "../contexts/FinanceContext";
import { Input } from "./ui/input";

const RetirementProjectionComponent: React.FC = () => {
  const { retirementData, updateRetirementData } = useFinance();
  const { monthlyDeposit, growthRate, portfolioValue, savingsRate } = retirementData;

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateRetirementData({ monthlyDeposit: value });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateRetirementData({ growthRate: value });
  };

  // Prepare data for chart
  const chartData = portfolioValue.map((val, i) => ({
    year: 2023 + i,
    portfolioValue: val,
    savingsRate: savingsRate[i],
  }));

  return (
    <div className="flex flex-col px-5 py-4">
      <h2 className="text-2xl font-bold mb-4">Retirement Growth</h2>
      
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
              formatter={(value) => [`€${Number(value).toLocaleString()}`, undefined]}
            />
            <Line 
              type="monotone" 
              dataKey="portfolioValue" 
              stroke="#4097FF" 
              strokeWidth={2}
              dot={false} 
              activeDot={{ r: 6 }} 
              name="Portfolio value"
            />
            <Line 
              type="monotone" 
              dataKey="savingsRate" 
              stroke="#cccccc" 
              strokeWidth={2}
              dot={false} 
              name="Savings rate"
            />
            <ReferenceLine x={2053} stroke="#444444" strokeDasharray="3 3" label={{ value: 'Retirement start', position: 'insideTopRight' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mb-4">
        <label htmlFor="monthly-deposit" className="block text-sm font-medium mb-1">
          Monthly Deposit
        </label>
        <div className="relative">
          <Input
            id="monthly-deposit"
            type="number"
            value={monthlyDeposit}
            onChange={handleDepositChange}
            className="pl-8 bg-white border-gray-200 rounded-lg text-xl font-semibold h-14"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">€</span>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="growth-rate" className="block text-sm font-medium mb-1">
          Estimated Growth Rate
        </label>
        <div className="relative">
          <Input
            id="growth-rate"
            type="number"
            value={growthRate}
            onChange={handleRateChange}
            className="pr-8 bg-white border-gray-200 rounded-lg text-xl font-semibold h-14"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl text-gray-400">%</span>
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">
            {growthRate} % p.a.
          </span>
        </div>
      </div>
    </div>
  );
};

export default RetirementProjectionComponent;


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
    year: 2025 + i,
    portfolioValue: val,
    savingsRate: savingsRate[i],
  }));

  // Find max value for Y-axis
  const maxValue = Math.max(...portfolioValue);
  const roundedMax = Math.ceil(maxValue / 1000) * 1000;
  
  // Create Y-axis ticks at 1/4, 1/2, 3/4 and max
  const yAxisTicks = [
    Math.round(roundedMax / 4),
    Math.round(roundedMax / 2),
    Math.round(roundedMax * 3 / 4),
    roundedMax
  ];

  // Create X-axis ticks for decades only (2030, 2040, etc.)
  const startYear = 2025;
  const xAxisTicks = Array.from({ length: 6 }, (_, i) => 
    startYear + i * 10 - ((startYear + i * 10) % 10)
  );

  // Custom formatter for the Y-axis values
  const formatYAxis = (value: number) => {
    return `${(value / 1000).toLocaleString()}k`;
  };

  return (
    <div className="flex flex-col px-5 py-4">
      <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
      <div className="text-3xl font-bold mb-2">
        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(portfolioValue[0])}
      </div>
      <div className="text-green-500 text-sm mb-6">
        +{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(monthlyDeposit)} ({growthRate}%)
      </div>
      
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
            <CartesianGrid 
              horizontal={true}
              vertical={false}
              stroke="#f0f0f0"
              strokeDasharray="3 3" 
            />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 10 }}
              ticks={xAxisTicks}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              ticks={yAxisTicks}
              tickFormatter={formatYAxis}
              tickLine={false}
              axisLine={false}
              orientation="right"
              domain={[0, roundedMax]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
              formatter={(value) => [`€${Number(value).toLocaleString()}`, undefined]}
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="portfolioValue" 
              stroke="#25D366" 
              strokeWidth={2}
              dot={false} 
              activeDot={{ r: 6, fill: "#25D366", stroke: "#fff" }} 
              name="Portfolio value"
            />
            <ReferenceLine x={2053} stroke="#444444" strokeDasharray="3 3" label={{ value: 'Retirement', position: 'insideTopRight', style: { fontSize: 10 } }} />
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

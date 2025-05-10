
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useFinance } from "../contexts/FinanceContext";
import { Input } from "./ui/input";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";

const RetirementProjectionComponent: React.FC = () => {
  const { retirementData, updateRetirementData } = useFinance();
  const { 
    monthlyDeposit, 
    growthRate, 
    depositGrowthRate,
    marketRate,
    retirementYearlyAmount,
    retirementGrowthRate,
    retirementStartYear
  } = retirementData;

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateRetirementData({ monthlyDeposit: value });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateRetirementData({ growthRate: value });
  };

  const handleMarketRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateRetirementData({ marketRate: value });
  };

  const handleRetirementYearlyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateRetirementData({ retirementYearlyAmount: value });
  };

  const handleRetirementGrowthRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateRetirementData({ retirementGrowthRate: value });
  };

  // Calculate the projection data based on the formulas
  const currentYear = 2025;
  const yearsToProject = 40; // Project 40 years into the future

  // Prepare data for chart
  const chartData = Array(yearsToProject).fill(0).map((_, i) => {
    const year = currentYear + i;
    const x = i; // Years from now
    
    // Function 1: Investment Growth
    const investmentGrowth = monthlyDeposit * 12 * Math.pow(1 + depositGrowthRate / 100, x);
    
    // Function 2: Future Value of Retirement Annuity
    let futureValueAnnuity = 0;
    if (Math.abs(depositGrowthRate/100 - marketRate/100) < 0.0001) {
      futureValueAnnuity = monthlyDeposit * 12 * x * Math.pow(1 + marketRate/100, x - 1);
    } else {
      futureValueAnnuity = monthlyDeposit * 12 * (
        (Math.pow(1 + depositGrowthRate/100, x) - Math.pow(1 + marketRate/100, x)) / 
        (depositGrowthRate/100 - marketRate/100)
      );
    }
    
    // Function 3: Retirement Spending (only after retirement)
    let retirementSpending = 0;
    if (year >= retirementStartYear) {
      const retirementYears = year - retirementStartYear;
      
      if (Math.abs(retirementGrowthRate/100 - marketRate/100) < 0.0001) {
        retirementSpending = retirementYearlyAmount * retirementYears;
      } else {
        retirementSpending = retirementYearlyAmount * (marketRate/100) * (
          (Math.pow(retirementGrowthRate/100 / (marketRate/100), retirementYears) - 1) / 
          (retirementGrowthRate/100 - marketRate/100)
        );
      }
    }
    
    return {
      year,
      investmentGrowth,
      futureValueAnnuity,
      retirementSpending,
    };
  });

  // Find max value for Y-axis
  const values = chartData.flatMap(d => [
    d.investmentGrowth, 
    d.futureValueAnnuity, 
    d.retirementSpending
  ]);
  const maxValue = Math.max(...values.filter(v => !isNaN(v) && isFinite(v)));
  const roundedMax = Math.ceil(maxValue / 1000) * 1000;
  
  // Create Y-axis ticks at 1/4, 1/2, 3/4 and max
  const yAxisTicks = [
    Math.round(roundedMax / 4),
    Math.round(roundedMax / 2),
    Math.round(roundedMax * 3 / 4),
    roundedMax
  ];

  // Create X-axis ticks for decades only (2030, 2040, etc.)
  const startYear = currentYear;
  const xAxisTicks = Array.from({ length: 6 }, (_, i) => 
    startYear + i * 10 - ((startYear + i * 10) % 10)
  );

  // Custom formatter for the Y-axis values
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    }
    return `${(value / 1000).toLocaleString()}k`;
  };

  // Chart configuration for the colors
  const chartConfig = {
    investmentGrowth: { color: "#25D366", label: "Investment Growth" },
    futureValueAnnuity: { color: "#0EA5E9", label: "Future Value Annuity" },
    retirementSpending: { color: "#333333", label: "Retirement Spending" },
  };

  return (
    <div className="flex flex-col px-5 py-4">
      <h2 className="text-2xl font-bold mb-4">Portfolio</h2>
      <div className="text-3xl font-bold mb-2">
        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(chartData[0]?.investmentGrowth || 0)}
      </div>
      <div className="text-green-500 text-sm mb-6">
        +{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(monthlyDeposit)} ({growthRate}%)
      </div>
      
      <div className="h-64 mb-6">
        <ChartContainer config={chartConfig}>
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
              <Tooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="investmentGrowth" 
                stroke="#25D366" 
                strokeWidth={2}
                dot={false} 
                activeDot={{ r: 6, fill: "#25D366", stroke: "#fff" }} 
                name="investmentGrowth"
              />
              <Line 
                type="monotone" 
                dataKey="futureValueAnnuity" 
                stroke="#0EA5E9" 
                strokeWidth={2}
                dot={false} 
                activeDot={{ r: 6, fill: "#0EA5E9", stroke: "#fff" }} 
                name="futureValueAnnuity"
              />
              <Line 
                type="monotone" 
                dataKey="retirementSpending" 
                stroke="#333333" 
                strokeWidth={2}
                dot={false} 
                activeDot={{ r: 6, fill: "#333333", stroke: "#fff" }} 
                name="retirementSpending"
              />
              <ReferenceLine 
                x={retirementStartYear} 
                stroke="#444444" 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Retirement', 
                  position: 'insideTopRight', 
                  style: { fontSize: 10 } 
                }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
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
      
      <div className="mb-4">
        <label htmlFor="market-rate" className="block text-sm font-medium mb-1">
          Market Rate
        </label>
        <div className="relative">
          <Input
            id="market-rate"
            type="number"
            value={marketRate}
            onChange={handleMarketRateChange}
            className="pr-8 bg-white border-gray-200 rounded-lg text-xl font-semibold h-14"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl text-gray-400">%</span>
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">
            {marketRate} % p.a.
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="retirement-yearly-amount" className="block text-sm font-medium mb-1">
          Retirement Yearly Amount
        </label>
        <div className="relative">
          <Input
            id="retirement-yearly-amount"
            type="number"
            value={retirementYearlyAmount}
            onChange={handleRetirementYearlyAmountChange}
            className="pl-8 bg-white border-gray-200 rounded-lg text-xl font-semibold h-14"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">€</span>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="retirement-growth-rate" className="block text-sm font-medium mb-1">
          Retirement Growth Rate
        </label>
        <div className="relative">
          <Input
            id="retirement-growth-rate"
            type="number"
            value={retirementGrowthRate}
            onChange={handleRetirementGrowthRateChange}
            className="pr-8 bg-white border-gray-200 rounded-lg text-xl font-semibold h-14"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl text-gray-400">%</span>
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">
            {retirementGrowthRate} % p.a.
          </span>
        </div>
      </div>
    </div>
  );
};

export default RetirementProjectionComponent;

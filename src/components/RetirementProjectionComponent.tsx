
import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useFinance } from "../contexts/FinanceContext";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

const RetirementProjectionComponent: React.FC = () => {
  const { retirementData, updateRetirementData } = useFinance();
  const { 
    monthlyDeposit: P_Deposit, 
    depositGrowthRate: i_payIn,
    marketRate: r_MrktRate,
    retirementStartYear: R_RentPayoutStart,
    retirementGrowthRate: i_PayoutIncrease,
    retirementDuration: N_RentDuration = 30 // Default value if not already in context
  } = retirementData;
  
  // Add animation state for Y-axis
  const [yAxisAnimatedMax, setYAxisAnimatedMax] = useState<number | null>(null);
  const [yAxisTicks, setYAxisTicks] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const previousMaxRef = useRef<number | null>(null);

  // Animation properties
  const animationDuration = 800; // milliseconds
  const animationDelay = 1200; // 1.2 second delay before animation starts
  const animationStartTimeRef = useRef<number | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Ensure retirementDuration is set if it doesn't exist
    if (retirementData.retirementDuration === undefined) {
      updateRetirementData({ retirementDuration: 30 });
    }
  }, [retirementData, updateRetirementData]);

  // Handle slider changes
  const handleDepositChange = (value: number[]) => {
    updateRetirementData({ monthlyDeposit: value[0] });
  };

  const handlePayInRateChange = (value: number[]) => {
    updateRetirementData({ depositGrowthRate: value[0] });
  };

  const handleMarketRateChange = (value: number[]) => {
    updateRetirementData({ marketRate: value[0] });
  };

  const handlePayoutIncreaseChange = (value: number[]) => {
    updateRetirementData({ retirementGrowthRate: value[0] });
  };

  const handleRetirementStartChange = (value: number[]) => {
    const currentYear = 2025;
    updateRetirementData({ retirementStartYear: currentYear + value[0] });
  };

  const handleRetirementDurationChange = (value: number[]) => {
    updateRetirementData({ retirementDuration: value[0] });
  };

  // Calculate the projection data based on the formulas
  const currentYear = 2025;
  const yearsToProject = 60; // Project 60 years into the future to cover longer retirement periods

  // Prepare data for chart
  const rentStartIndex = R_RentPayoutStart - currentYear;
  let g_at_retirement = 0;
  
  if (Math.abs(i_payIn/100 - r_MrktRate/100) < 0.0001) {
    g_at_retirement = P_Deposit * 12 * rentStartIndex * Math.pow(1 + i_payIn/100, rentStartIndex - 1);
  } else {
    g_at_retirement = P_Deposit * 12 * (
      (Math.pow(1 + i_payIn/100, rentStartIndex) - Math.pow(1 + r_MrktRate/100, rentStartIndex)) /
      (i_payIn/100 - r_MrktRate/100)
    );
  }
  
  const numerator = i_PayoutIncrease/100 - r_MrktRate/100;
  const denominator = Math.pow((1 + i_PayoutIncrease/100) / (1 + r_MrktRate/100), N_RentDuration) - 1;
  const C_growth = Math.abs(denominator) < 0.0001 ? g_at_retirement : g_at_retirement * numerator / denominator;
  
  // Calculate inflation-adjusted interest rate
  const inflationAdjustedInterest = (() => {
    // Formula: g(R_RentPayoutStart) * (((1+i_PayoutIncrease)/(1+r_MrktRate))^N_RentDuration - 1)/(i_PayoutIncrease-r_MrktRate)
    
    // Check for division by zero
    if (Math.abs(i_PayoutIncrease - r_MrktRate) < 0.0001) {
      return g_at_retirement * N_RentDuration;
    }
    
    const adjustedNumerator = Math.pow((1 + i_PayoutIncrease/100) / (1 + r_MrktRate/100), N_RentDuration) - 1;
    const adjustedDenominator = i_PayoutIncrease/100 - r_MrktRate/100;
    
    return g_at_retirement * (adjustedNumerator / adjustedDenominator);
  })();

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}k`;
    }
    return `€${value.toFixed(2)}`;
  };

  const chartData = Array(yearsToProject).fill(0).map((_, i) => {
    const year = currentYear + i;
    const x = i;
    
    let f_value = null;
    let g_value = null;
    let h_value = null;
    
    if (x >= 1 && year <= R_RentPayoutStart) {
      f_value = P_Deposit * 12 * ((Math.pow(1 + i_payIn/100, x) - 1) / (i_payIn/100));
    }
  
    if (x >= 1 && year <= R_RentPayoutStart) {
      if (Math.abs(i_payIn/100 - r_MrktRate/100) < 0.0001) {
        g_value = P_Deposit * 12 * x * Math.pow(1 + i_payIn/100, x - 1);
      } else {
        g_value = P_Deposit * 12 * (
          (Math.pow(1 + i_payIn/100, x) - Math.pow(1 + r_MrktRate/100, x)) / 
          (i_payIn/100 - r_MrktRate/100)
        );
      }
    }
  
    if (x >= 1 && year >= R_RentPayoutStart && (year - R_RentPayoutStart) <= N_RentDuration) {
      const years_since_retirement = year - R_RentPayoutStart;
      const years_left = N_RentDuration - years_since_retirement;
  
      const factor1 = Math.pow(1 + i_PayoutIncrease/100, years_since_retirement);
      const factor2 = Math.pow((1 + i_PayoutIncrease/100) / (1 + r_MrktRate/100), years_left) - 1;
  
      if (Math.abs(i_PayoutIncrease/100 - r_MrktRate/100) < 0.0001 || Math.abs(factor2) < 0.0001) {
        h_value = C_growth * (N_RentDuration - years_since_retirement);
      } else {
        h_value = C_growth * factor1 * factor2 / (i_PayoutIncrease/100 - r_MrktRate/100);
      }
    }
      
    return {
      year,
      f: f_value,
      g: g_value,
      h: h_value,
    };
  });

  // Find max value for Y-axis
  const values = chartData.flatMap(d => [d.f, d.g, d.h]);
  const maxValue = Math.max(...values.filter(v => !isNaN(v) && isFinite(v)));
  const roundedMax = Math.ceil(maxValue / 1000) * 1000;
  
  // Y-axis animation logic with delay
  useEffect(() => {
    if (!previousMaxRef.current) {
      // First render, set initial values without animation
      previousMaxRef.current = roundedMax;
      setYAxisAnimatedMax(roundedMax);
      setYAxisTicks([
        Math.round(roundedMax / 4),
        Math.round(roundedMax / 2),
        Math.round(roundedMax * 3 / 4),
        roundedMax
      ]);
      return;
    }

    // If the max value changed, animate to the new value after delay
    if (roundedMax !== previousMaxRef.current) {
      const startValue = previousMaxRef.current;
      const targetValue = roundedMax;
      
      // Clear any existing animations or timeouts
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }

      // Wait for delay before starting animation
      delayTimeoutRef.current = setTimeout(() => {
        animationStartTimeRef.current = performance.now();
        
        // Easing function for smooth animation
        const easeOutCubic = (t: number): number => {
          return 1 - Math.pow(1 - t, 3);
        };

        // Animation loop
        const animateYAxis = (timestamp: number) => {
          if (!animationStartTimeRef.current) return;
          
          const elapsed = timestamp - animationStartTimeRef.current;
          const progress = Math.min(elapsed / animationDuration, 1);
          const easedProgress = easeOutCubic(progress);
          
          // Interpolate between start and target values
          const currentMax = startValue + (targetValue - startValue) * easedProgress;
          setYAxisAnimatedMax(currentMax);
          
          // Update ticks with animated values
          setYAxisTicks([
            Math.round(currentMax / 4),
            Math.round(currentMax / 2),
            Math.round(currentMax * 3 / 4),
            Math.round(currentMax)
          ]);
          
          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animateYAxis);
          } else {
            // Animation complete, update the previous max value
            previousMaxRef.current = targetValue;
            animationStartTimeRef.current = null;
            animationFrameRef.current = null;
          }
        };
        
        // Start animation
        animationFrameRef.current = requestAnimationFrame(animateYAxis);
        
        delayTimeoutRef.current = null;
      }, animationDelay);
    }
    
    // Cleanup animation on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [roundedMax]);

  // Create X-axis ticks for decades only (2030, 2040, etc.)
  const startYear = currentYear;
  const xAxisTicks = Array.from({ length: 7 }, (_, i) => 
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
    f: { color: "#132676", label: "Function f(x)" },
    g: { color: "#2cde76", label: "Function g(x)" },
    h: { color: "#727272", label: "Function h(x)" },
  };

  return (
    <div className="flex flex-col px-5 py-4">
      <div className="h-96 mb-5">
        <div                       
          style={{
            height: "100%",       
            maxWidth: "110%",
            width: "110%",
            margin: "0 auto",
            overflowX: "visible",
            overflowY: "visible", 
          }}
        >
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 260, left: 15, bottom: 5 }}>
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
                  domain={[0, yAxisAnimatedMax || roundedMax]}
                  allowDataOverflow={true}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="f" 
                  stroke="#132676" 
                  strokeWidth={3}
                  dot={false} 
                  activeDot={{ r: 6, fill: "#0000FF", stroke: "#fff" }} 
                  name="f"
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
                <Line 
                  type="monotone" 
                  dataKey="g" 
                  stroke="#2cde76" 
                  strokeWidth={3}
                  dot={false} 
                  activeDot={{ r: 6, fill: "#2cde76", stroke: "#fff" }} 
                  name="g"
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
                <Line 
                  type="monotone" 
                  dataKey="h" 
                  stroke="#727272" 
                  strokeWidth={3}
                  dot={false} 
                  activeDot={{ r: 6, fill: "#727272", stroke: "#fff" }} 
                  name="h"
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
                <ReferenceLine 
                  x={R_RentPayoutStart} 
                  stroke="#444444" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Retirement  ', 
                    position: 'insideTopRight', 
                    style: { fontSize: 10 } 
                  }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
      
      {/* Inflation-adjusted interest rate card */}
      <Card className="mb-6 bg-[#F1F0FB] border-[#9b87f5]/20">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-[#7E69AB]">Inflation-Adjusted Interest</div>
            <div className="text-lg font-semibold text-[#9b87f5]">
              {formatCurrency(inflationAdjustedInterest)}
            </div>
          </div>
          <Separator className="my-2 bg-[#9b87f5]/10" />
          <div className="text-xs text-[#8E9196]">
            Based on a {N_RentDuration}-year retirement period with {i_PayoutIncrease}% annual payout increase and {r_MrktRate}% market rate
          </div>
        </div>
      </Card>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Monthly Deposit (P_Deposit): €{P_Deposit}</label>
          </div>
          <Slider 
            defaultValue={[P_Deposit]} 
            max={2000}
            min={0}
            step={10}
            onValueChange={handleDepositChange}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Deposit Growth Rate (i_payIn): {i_payIn}%</label>
          </div>
          <Slider 
            defaultValue={[i_payIn]} 
            max={10}
            min={0}
            step={0.1}
            onValueChange={handlePayInRateChange}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Retirement Start Year (R_RentPayoutStart): {R_RentPayoutStart}</label>
          </div>
          <Slider 
            defaultValue={[R_RentPayoutStart - currentYear]} 
            max={100}
            min={5}
            step={1}
            onValueChange={handleRetirementStartChange}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Market Rate (r_MrktRate): {r_MrktRate}%</label>
          </div>
          <Slider 
            defaultValue={[r_MrktRate]} 
            max={15}
            min={1}
            step={0.1}
            onValueChange={handleMarketRateChange}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Retirement Growth Rate (i_PayoutIncrease): {i_PayoutIncrease}%</label>
          </div>
          <Slider 
            defaultValue={[i_PayoutIncrease]} 
            max={10}
            min={0}
            step={0.1}
            onValueChange={handlePayoutIncreaseChange}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Retirement Duration (N_RentDuration): {N_RentDuration} years</label>
          </div>
          <Slider 
            defaultValue={[N_RentDuration]} 
            max={50}
            min={10}
            step={1}
            onValueChange={handleRetirementDurationChange}
          />
        </div>
      </div>
    </div>
  );
};

export default RetirementProjectionComponent;

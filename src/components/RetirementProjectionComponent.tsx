import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from "recharts";
import { useFinance } from "../contexts/FinanceContext";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";

const RetirementProjectionComponent: React.FC = () => {
  const { retirementData, updateRetirementData, expenses, setActiveTab } = useFinance();
  const { 
    monthlyDeposit: P_Deposit, 
    depositGrowthRate: i_payIn,
    marketRate: r_MrktRate,
    retirementStartYear: R_RentPayoutStart,
    retirementGrowthRate: i_PayoutIncrease,
    retirementDuration: N_RentDuration = 20, // Default value if not already in context
    initialCapital = 0 // Get initialCapital with default value of 0
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
  
  // Create local state for the input field to handle changes
  const [depositInputValue, setDepositInputValue] = useState(P_Deposit.toString());
  
  useEffect(() => {
    // Ensure retirementDuration is set if it doesn't exist
    if (retirementData.retirementDuration === undefined) {
      updateRetirementData({ retirementDuration: 20 });
    }
  }, [retirementData, updateRetirementData]);

  // Update local state when the context value changes
  useEffect(() => {
    setDepositInputValue(P_Deposit.toString());
  }, [P_Deposit]);

  // Handle input change for monthly deposit
  const handleDepositInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepositInputValue(e.target.value);
  };

  // Handle blur for monthly deposit (commits the change to context)
  const handleDepositBlur = () => {
    const value = parseInt(depositInputValue, 10);
    if (!isNaN(value) && value >= 0) {
      updateRetirementData({ monthlyDeposit: value });
    } else {
      // Reset to last valid value if input is invalid
      setDepositInputValue(P_Deposit.toString());
    }
  };

  // Handle pressing Enter for monthly deposit
  const handleDepositKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDepositBlur();
    }
  };

  // Handle retirement year selection
  const handleRetirementYearChange = (value: string) => {
    updateRetirementData({ retirementStartYear: parseInt(value, 10) });
  };

  // Calculate the projection data based on the formulas
  const currentYear = 2025;
  const yearsToProject = 70; // Project 70 years into the future to cover longer retirement periods

  // Generate years for the dropdown
  const retirementYearOptions = Array.from({ length: 71 }, (_, i) => currentYear + i + 1);
  
  // Prepare data for chart
  const rentStartIndex = R_RentPayoutStart - currentYear;
  
  // Include initialCapital in the calculation
  let g_at_retirement = initialCapital; // Start with initial capital
  
  if (Math.abs(i_payIn/100 - r_MrktRate/100) < 0.0001) {
    g_at_retirement += P_Deposit * 12 * rentStartIndex * Math.pow(1 + i_payIn/100, rentStartIndex - 1);
  } else {
    g_at_retirement += P_Deposit * 12 * (
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

  // Calculate monthly pension amount (divide annual amount by 12)
  const monthlyPension = inflationAdjustedInterest / (N_RentDuration * 12)*1/12;

  // Get first expense category amount for the message
  const firstExpenseAmount = expenses.categories.length > 0 ? expenses.categories[0].amount : 0;
  
  // Calculate potential wealth increase (simple estimate - 10% of first expense saved over years until retirement)
  const potentialMonthlySavings = Math.round(firstExpenseAmount * 0.1);
  const potentialIncrease = Math.round(potentialMonthlySavings * 12 * (R_RentPayoutStart - currentYear) * (1 + r_MrktRate/100));

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}k`;
    }
    return `€${value.toFixed(2)}`;
  };

  // Handle click on the expenses link
  const handleExpensesLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab("expenses");
  };

  // Prepare data for chart
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
      // Include initialCapital in g_value calculation
      if (Math.abs(i_payIn/100 - r_MrktRate/100) < 0.0001) {
        g_value = initialCapital * Math.pow(1 + r_MrktRate/100, x) + 
                  P_Deposit * 12 * x * Math.pow(1 + i_payIn/100, x - 1);
      } else {
        g_value = initialCapital * Math.pow(1 + r_MrktRate/100, x) + 
                  P_Deposit * 12 * (
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
      f: f_value !== null ? Math.round(f_value) : null,
      g: g_value !== null ? Math.round(g_value) : null,
      h: h_value !== null ? Math.round(h_value) : null,
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
            Math.round(currentMax * 1.1)
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
  const xAxisTicks = Array.from({ length: 7.7}, (_, i) => 
    startYear + i * 10 - ((startYear + i * 10) % 10)
  );

  // Custom formatter for the Y-axis values
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    }
    return `${(value / 1000).toLocaleString()}k`;
  };

  // Chart configuration for the colors and labels
  const chartConfig = {
    f: { color: "#132676", label: "Invested Capital" },
    g: { color: "#2cde76", label: "Wealth" },
    h: { color: "#727272", label: "Remaining Pension" },
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
                >
                  <Label 
                    value="Invested Capital" 
                    position="insideBottom" 
                    offset={10}
                    style={{ fontSize: 11, fill: "#132676", fontWeight: 500 }}
                  />
                </Line>
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
                >
                  <Label 
                    value="Wealth" 
                    position="top" 
                    offset={10}
                    style={{ fontSize: 11, fill: "#2cde76", fontWeight: 500 }}
                  />
                </Line>
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
                    value: 'Retirement', 
                    position: 'insideTopRight', 
                    offset: 15,
                    style: { fontSize: 11, fontWeight: 500 } 
                  }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
      
      {/* Trade Republic style minimalistic card */}
      <Card className="mb-6 bg-white border-gray-100 shadow-sm">
        <div className="p-5">
          <div className="flex flex-col space-y-1">
            <div className="text-sm font-normal text-[#403E43]">Expected Monthly Pension</div>
            <div className="text-2xl font-semibold text-[#221F26]">
              {formatCurrency(monthlyPension)}
            </div>
          </div>
          <Separator className="my-3 bg-gray-100" />
          <div className="text-xs text-[#8A898C]">
            Approximation based on average market returns and current monthly deposits under assumed growth rate
          </div>
        </div>
      </Card>
      
      {/* Trade Republic style CTA card */}
      <Card className="mb-6 bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-black mb-1">Boost your retirement</h4>
              <p className="text-xs text-gray-600">
                Save <span className="font-medium">{firstExpenseAmount > 0 ? formatCurrency(potentialMonthlySavings) : '€50'}</span> monthly from expenses to gain <span className="font-medium">{formatCurrency(potentialIncrease)}</span>
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="mt-3 md:mt-0 text-xs border border-gray-200 hover:bg-gray-50 hover:text-black transition-all" 
            onClick={handleExpensesLinkClick}
          >
            View expenses <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </Card>
      
      <div className="flex w-full gap-8">
        {/* Monthly Deposit Input Field */}
        <div className="space-y-2 w-1/2 max-w-xs">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Monthly Deposit</label>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={depositInputValue}
              onChange={handleDepositInputChange}
              onBlur={handleDepositBlur}
              onKeyDown={handleDepositKeyDown}
              min="0"
              className="pr-8 w-full"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
          </div>
        </div>
        
        {/* Retirement Year Select */}
        <div className="space-y-2 w-1/2 max-w-xs">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Retirement Start Year</label>
          </div>
          <Select 
            value={R_RentPayoutStart.toString()} 
            onValueChange={handleRetirementYearChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {retirementYearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default RetirementProjectionComponent;

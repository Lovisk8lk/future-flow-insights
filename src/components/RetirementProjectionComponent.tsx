
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
  
  // Enhanced monthly deposit amount (original + €15)
  const enhancedMonthlyDeposit = P_Deposit + 15;
  
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

  // --- hard-cap the X-axis at 2080 and derive yearsToProject from it ---
  const lastYearToDisplay = 2080;                       // ⇢ right-edge of chart
  const yearsToProject    = lastYearToDisplay - currentYear + 1;

  // Generate years for the dropdown
  const retirementYearOptions = Array.from({ length: 71 }, (_, i) => currentYear + i + 1);
  
  // Prepare data for chart
  const rentStartIndex = R_RentPayoutStart - currentYear;
  
  // Store the wealth value at retirement for normal and enhanced scenarios
  let wealthAtRetirement = 0;
  let enhancedWealthAtRetirement = 0;
  
  // Prepare data for chart with initialCapital as starting point
  const chartData = Array.from({ length: yearsToProject }, (_, i) => {
    const year = currentYear + i;
    const x = i;
    
    let f_value = null; // Invested Capital
    let g_value = null; // Wealth
    let h_value = null; // Remaining Pension
    let g_prime_value = null; // Enhanced Wealth (+15€)
    let h_prime_value = null; // Enhanced Remaining Pension (+15€)
    
    // For the very first year (current year), set the initial values to initialCapital
    if (x === 0) {
      f_value = initialCapital;
      g_value = initialCapital;
      g_prime_value = initialCapital;
    } else if (year <= R_RentPayoutStart) {
      // Invested Capital calculation - starts from initialCapital
      f_value = initialCapital + P_Deposit * 12 * ((Math.pow(1 + i_payIn/100, x) - 1) / (i_payIn/100));
      
      // Wealth calculation - starts from initialCapital
      if (Math.abs(i_payIn/100 - r_MrktRate/100) < 0.0001) {
        g_value = initialCapital * Math.pow(1 + r_MrktRate/100, x) + 
                 P_Deposit * 12 * x * Math.pow(1 + i_payIn/100, x - 1);
        
        // Enhanced Wealth calculation (with +15€)
        g_prime_value = initialCapital * Math.pow(1 + r_MrktRate/100, x) + 
                       enhancedMonthlyDeposit * 12 * x * Math.pow(1 + i_payIn/100, x - 1);
      } else {
        g_value = initialCapital * Math.pow(1 + r_MrktRate/100, x) + 
                 P_Deposit * 12 * (
                   (Math.pow(1 + i_payIn/100, x) - Math.pow(1 + r_MrktRate/100, x)) / 
                   (i_payIn/100 - r_MrktRate/100)
                 );
                 
        // Enhanced Wealth calculation (with +15€)
        g_prime_value = initialCapital * Math.pow(1 + r_MrktRate/100, x) + 
                       enhancedMonthlyDeposit * 12 * (
                         (Math.pow(1 + i_payIn/100, x) - Math.pow(1 + r_MrktRate/100, x)) / 
                         (i_payIn/100 - r_MrktRate/100)
                       );
      }
      
      // Store the wealth value at retirement
      if (year === R_RentPayoutStart) {
        wealthAtRetirement = g_value;
        enhancedWealthAtRetirement = g_prime_value;
      }
    }
    
    // Calculate remaining pension value starting from the wealth at retirement
    if (x >= 1 && year >= R_RentPayoutStart && (year - R_RentPayoutStart) <= N_RentDuration) {
      const years_since_retirement = year - R_RentPayoutStart;
      const years_left = N_RentDuration - years_since_retirement;
      
      // Regular pension calculations
      if (years_since_retirement === 0) {
        h_value = wealthAtRetirement;
        h_prime_value = enhancedWealthAtRetirement;
      } else {
        const factor1 = Math.pow(1 + i_PayoutIncrease/100, years_since_retirement);
        const factor2 = Math.pow((1 + i_PayoutIncrease/100) / (1 + r_MrktRate/100), years_left) - 1;
        
        // Calculate C_growth based on wealthAtRetirement
        const numerator = i_PayoutIncrease/100 - r_MrktRate/100;
        const denominator = Math.pow((1 + i_PayoutIncrease/100) / (1 + r_MrktRate/100), N_RentDuration) - 1;
        
        // Regular pension
        const C_growth = Math.abs(denominator) < 0.0001 ? 
                         wealthAtRetirement : 
                         wealthAtRetirement * numerator / denominator;
        
        // Enhanced pension
        const C_growth_prime = Math.abs(denominator) < 0.0001 ? 
                              enhancedWealthAtRetirement : 
                              enhancedWealthAtRetirement * numerator / denominator;
        
        if (Math.abs(i_PayoutIncrease/100 - r_MrktRate/100) < 0.0001 || Math.abs(factor2) < 0.0001) {
          h_value = C_growth * (N_RentDuration - years_since_retirement);
          h_prime_value = C_growth_prime * (N_RentDuration - years_since_retirement);
        } else {
          h_value = C_growth * factor1 * factor2 / (i_PayoutIncrease/100 - r_MrktRate/100);
          h_prime_value = C_growth_prime * factor1 * factor2 / (i_PayoutIncrease/100 - r_MrktRate/100);
        }
      }
    }
      
    return {
      year,
      f: f_value !== null ? Math.round(f_value) : null,
      g: g_value !== null ? Math.round(g_value) : null,
      h: h_value !== null ? Math.round(h_value) : null,
      g_prime: g_prime_value !== null ? Math.round(g_prime_value) : null,
      h_prime: h_prime_value !== null ? Math.round(h_prime_value) : null,
    };
  });

  // Calculate monthly pension amount based on wealthAtRetirement
  const inflationAdjustedInterest = (() => {
    if (Math.abs(i_PayoutIncrease - r_MrktRate) < 0.0001) {
      return wealthAtRetirement * N_RentDuration;
    }
    
    const adjustedNumerator = Math.pow((1 + i_PayoutIncrease/100) / (1 + r_MrktRate/100), N_RentDuration) - 1;
    const adjustedDenominator = i_PayoutIncrease/100 - r_MrktRate/100;
    
    return wealthAtRetirement * (adjustedNumerator / adjustedDenominator);
  })();

  // Calculate enhanced monthly pension amount
  const enhancedInflationAdjustedInterest = (() => {
    if (Math.abs(i_PayoutIncrease - r_MrktRate) < 0.0001) {
      return enhancedWealthAtRetirement * N_RentDuration;
    }
    
    const adjustedNumerator = Math.pow((1 + i_PayoutIncrease/100) / (1 + r_MrktRate/100), N_RentDuration) - 1;
    const adjustedDenominator = i_PayoutIncrease/100 - r_MrktRate/100;
    
    return enhancedWealthAtRetirement * (adjustedNumerator / adjustedDenominator);
  })();

  // Calculate monthly pension amount (divide annual amount by 12)
  const monthlyPension = inflationAdjustedInterest / (N_RentDuration * 12) * 1/12;
  
  // Calculate enhanced monthly pension amount
  const enhancedMonthlyPension = enhancedInflationAdjustedInterest / (N_RentDuration * 12) * 1/12;

  // Get first expense category amount for the message
  const firstExpenseAmount = expenses.categories.length > 0 ? expenses.categories[0].amount : 0;
  
  // Calculate potential wealth increase (simple estimate - 10% of first expense saved over years until retirement)
  const potentialMonthlySavings = Math.round(firstExpenseAmount * 0.1);
  const potentialIncrease = Math.round(potentialMonthlySavings * 12 * (R_RentPayoutStart - currentYear) * (1 + r_MrktRate/100));

  // Find max value for Y-axis including the enhanced projections
  const values = chartData.flatMap(d => [d.f, d.g, d.h, d.g_prime, d.h_prime]);
  const maxValue = Math.max(...values.filter(v => !isNaN(v) && isFinite(v)));
  const roundedMax = Math.ceil(maxValue / 1000) * 1000;

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}k`;
    }
    return `€${value.toFixed(2)}`;
  };

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

  // ─── decade ticks: start at the first full decade *after* the current year ───
  const firstDecadeTick = Math.ceil(currentYear / 10) * 10;   // 2025 → 2030
  const xAxisTicks = Array.from(
    { length: Math.floor((lastYearToDisplay - firstDecadeTick) / 10) + 1 },
    (_, i) => firstDecadeTick + i * 10
  );   // ➜ [2030, 2040, 2050, … 2080]

  // Custom formatter for the Y-axis values
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    }
    return `${(value / 1000).toLocaleString()}k`;
  };

  // Handle click on the expenses link
  const handleExpensesLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab("expenses");
  };

  // Chart configuration for the colors and labels
  const chartConfig = {
    f: { color: "#132676", label: "Invested Capital" },
    g: { color: "#2cde76", label: "Wealth" },
    h: { color: "#727272", label: "Remaining Pension" },
    g_prime: { color: "#cfecdc", label: "Wealth (+€15)" },
    h_prime: { color: "#bababa", label: "Remaining Pension (+€15)" },
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
                  type="number"                              
                  domain={[currentYear, lastYearToDisplay]}  
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
                {/* New enhanced wealth line (g_prime) */}
                <Line 
                  type="monotone" 
                  dataKey="g_prime" 
                  stroke="#ffc107" 
                  strokeWidth={3}
                  dot={false} 
                  activeDot={{ r: 6, fill: "#ffc107", stroke: "#fff" }} 
                  name="g_prime"
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                >
                  <Label 
                    value="Wealth (+€15)" 
                    position="top" 
                    offset={10}
                    style={{ fontSize: 11, fill: "#ffc107", fontWeight: 500 }}
                  />
                </Line>
                {/* New enhanced pension line (h_prime) */}
                <Line 
                  type="monotone" 
                  dataKey="h_prime" 
                  stroke="#ffab40" 
                  strokeWidth={3}
                  dot={false} 
                  activeDot={{ r: 6, fill: "#ffab40", stroke: "#fff" }} 
                  name="h_prime"
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
      
      {/* Trade Republic style minimalistic card showing both pension values */}
      <Card className="mb-6 bg-white border-gray-100 shadow-sm">
        <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col space-y-1 mb-4 md:mb-0">
              <div className="text-sm font-normal text-[#403E43]">Expected Monthly Pension</div>
              <div className="text-2xl font-semibold text-[#221F26]">
                {formatCurrency(monthlyPension)}
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <div className="text-sm font-normal text-[#403E43]">With +€15 Monthly</div>
              <div className="text-2xl font-semibold text-[#ffc107]">
                {formatCurrency(enhancedMonthlyPension)}
                <span className="text-sm text-green-500 ml-2">
                  +{formatCurrency(enhancedMonthlyPension - monthlyPension)}
                </span>
              </div>
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

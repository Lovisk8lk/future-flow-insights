
import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useFinance } from "../contexts/FinanceContext";
import { Slider } from "./ui/slider";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";

const RetirementProjectionComponent: React.FC = () => {
  const { retirementData, updateRetirementData } = useFinance();
  const { 
    monthlyDeposit: P_Deposit, 
    depositGrowthRate: i_payIn,
    marketRate: r_MrktRate,
    retirementStartYear: R_RentPayoutStart,
    retirementGrowthRate: i_PayoutIncrease,
    retirementDuration: N_RentDuration = 30
  } = retirementData;

  useEffect(() => {
    if (retirementData.retirementDuration === undefined) {
      updateRetirementData({ retirementDuration: 30 });
    }
  }, [retirementData, updateRetirementData]);

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

  const handleRetirementDurationChange = (value: number[]) => {
    updateRetirementData({ retirementDuration: value[0] });
  };

  const currentYear = 2025;
  const yearsToProject = 80;

  const visibleYearsRange = yearsToProject;
  const retirementPosition = useMemo(() => {
    return Math.round(currentYear + visibleYearsRange * 0.75);
  }, [visibleYearsRange]);

  useEffect(() => {
    if (R_RentPayoutStart !== retirementPosition) {
      updateRetirementData({ retirementStartYear: retirementPosition });
    }
  }, [retirementPosition, R_RentPayoutStart, updateRetirementData]);

  const rentStartIndex = R_RentPayoutStart - currentYear;
  let g_at_retirement = 0;

  if (Math.abs(i_payIn / 100 - r_MrktRate / 100) < 0.0001) {
    g_at_retirement = P_Deposit * 12 * rentStartIndex * Math.pow(1 + i_payIn / 100, rentStartIndex - 1);
  } else {
    g_at_retirement = P_Deposit * 12 * (
      (Math.pow(1 + i_payIn / 100, rentStartIndex) - Math.pow(1 + r_MrktRate / 100, rentStartIndex)) /
      (i_payIn / 100 - r_MrktRate / 100)
    );
  }

  const numerator = i_PayoutIncrease / 100 - r_MrktRate / 100;
  const denominator = Math.pow((1 + i_PayoutIncrease / 100) / (1 + r_MrktRate / 100), N_RentDuration) - 1;
  const C_growth = Math.abs(denominator) < 0.0001 ? g_at_retirement : g_at_retirement * numerator / denominator;

  const chartData = useMemo(() => {
    return Array(yearsToProject).fill(0).map((_, i) => {
      const year = currentYear + i;
      const x = i;

      let f_value = null;
      let g_value = null;
      let h_value = null;

      if (x >= 1 && year <= R_RentPayoutStart) {
        f_value = P_Deposit * 12 * ((Math.pow(1 + i_payIn / 100, x) - 1) / (i_payIn / 100));
      }

      if (x >= 1 && year <= R_RentPayoutStart) {
        if (Math.abs(i_payIn / 100 - r_MrktRate / 100) < 0.0001) {
          g_value = P_Deposit * 12 * x * Math.pow(1 + i_payIn / 100, x - 1);
        } else {
          g_value = P_Deposit * 12 * (
            (Math.pow(1 + i_payIn / 100, x) - Math.pow(1 + r_MrktRate / 100, x)) /
            (i_payIn / 100 - r_MrktRate / 100)
          );
        }
      }

      if (x >= 1 && year >= R_RentPayoutStart && (year - R_RentPayoutStart) <= N_RentDuration) {
        const years_since_retirement = year - R_RentPayoutStart;
        const years_left = N_RentDuration - years_since_retirement;

        const factor1 = Math.pow(1 + i_PayoutIncrease / 100, years_since_retirement);
        const factor2 = Math.pow((1 + i_PayoutIncrease / 100) / (1 + r_MrktRate / 100), years_left) - 1;

        if (Math.abs(i_PayoutIncrease / 100 - r_MrktRate / 100) < 0.0001 || Math.abs(factor2) < 0.0001) {
          h_value = C_growth * (N_RentDuration - years_since_retirement);
        } else {
          h_value = C_growth * factor1 * factor2 / (i_PayoutIncrease / 100 - r_MrktRate / 100);
        }
      }

      return {
        year,
        f: f_value,
        g: g_value,
        h: h_value,
      };
    });
  }, [P_Deposit, i_payIn, r_MrktRate, R_RentPayoutStart, i_PayoutIncrease, N_RentDuration, C_growth, currentYear]);

  const values = chartData.flatMap(d => [d.f, d.g, d.h]);
  const maxValue = Math.max(...values.filter(v => !isNaN(v) && isFinite(v)));
  const roundedMax = Math.ceil(maxValue / 1000) * 1000 * 1.1;

  const yAxisTicks = [
    Math.round(roundedMax / 4),
    Math.round(roundedMax / 2),
    Math.round(roundedMax * 3 / 4),
    roundedMax
  ];

  const startYear = currentYear;
  const xAxisTicks = Array.from({ length: 8 }, (_, i) => startYear + i * 10);

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    }
    return `${(value / 1000).toLocaleString()}k`;
  };

  const chartConfig = {
    f: { color: "#132676", label: "Initial Deposits" },
    g: { color: "#2cde76", label: "Growth Phase" },
    h: { color: "#727272", label: "Retirement Phase" },
  };

  return (
    <div className="flex flex-col px-5 py-4">
      <div style={{ height: "600px", marginBottom: "0" }}>
        <ChartContainer config={chartConfig} style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 5, bottom: 10 }}>
              <CartesianGrid horizontal vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} ticks={xAxisTicks} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} ticks={yAxisTicks} tickFormatter={formatYAxis} tickLine={false} axisLine={false} orientation="right" domain={[0, roundedMax]} />
              <Tooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="f" stroke="#132676" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#132676", stroke: "#fff" }} name="f" />
              <Line type="monotone" dataKey="g" stroke="#2cde76" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#2cde76", stroke: "#fff" }} name="g" />
              <Line type="monotone" dataKey="h" stroke="#727272" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#727272", stroke: "#fff" }} name="h" />
              <ReferenceLine x={retirementPosition} stroke="#444444" strokeDasharray="3 3" label={{ value: 'Retirement', position: 'insideTopRight', style: { fontSize: 10 } }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default RetirementProjectionComponent;

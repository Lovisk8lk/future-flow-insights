
import React, { useState, useEffect } from "react";
import { useFinance } from "../contexts/FinanceContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RetirementProjectionComponent: React.FC = () => {
  const { retirementData } = useFinance();
  const { monthlyDeposit, growthRate, depositGrowthRate, marketRate, retirementYearlyAmount, retirementGrowthRate, retirementStartYear } = retirementData;
  const [projectionData, setProjectionData] = useState<{ year: number; portfolio: number; savings: number; payout?: number; }[]>([]);

  useEffect(() => {
    const data = calculateProjection();
    setProjectionData(data);
  }, [monthlyDeposit, growthRate, depositGrowthRate, marketRate, retirementYearlyAmount, retirementGrowthRate, retirementStartYear, retirementData.initialCapital]);

  // Take initial capital into account for the calculation
  const calculateProjection = () => {
    // Get current year
    const currentYear = new Date().getFullYear();
    const yearsToRetirement = retirementStartYear - currentYear;
    
    // Define the number of years for the projection
    const currentDate = new Date();
    const totalYears = 80 - currentDate.getFullYear() + currentDate.getFullYear();
    
    // Define initial values
    let yearlyDeposit = monthlyDeposit * 12;
    let payout = retirementYearlyAmount;
    
    // Take initialCapital into account if available
    const initialCapital = retirementData.initialCapital || 0;
    
    const dataPoints = [];
    // Initialize total with initialCapital
    let total = initialCapital;
    
    // Update the data structure based on the calculations
    for (let year = 0; year < totalYears; year++) {
      const currentYear = year + currentDate.getFullYear();
      const isRetirementPhase = currentYear >= retirementStartYear;
      
      if (!isRetirementPhase) {
        // Accumulation phase
        total += yearlyDeposit;
        total *= (1 + growthRate / 100);
        yearlyDeposit *= (1 + depositGrowthRate / 100);
        
        dataPoints.push({
          year: currentYear,
          portfolio: total,
          savings: yearlyDeposit,
        });
      } else {
        // Retirement phase
        if (total > payout) {
          total -= payout;
          payout *= (1 + retirementGrowthRate / 100);
          total *= (1 + marketRate / 100);
          
          dataPoints.push({
            year: currentYear,
            portfolio: total,
            savings: yearlyDeposit,
            payout: payout,
          });
        } else {
          dataPoints.push({
            year: currentYear,
            portfolio: 0,
            savings: yearlyDeposit,
            payout: payout,
          });
        }
      }
    }
    
    return dataPoints;
  };

  const chartData = {
    labels: projectionData.map(data => data.year),
    datasets: [
      {
        label: 'Portfolio Value',
        data: projectionData.map(data => data.portfolio),
        fill: true,
        backgroundColor: 'rgba(64, 151, 255, 0.2)',
        borderColor: '#4097FF',
        tension: 0.4
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Portfolio Value (€)'
        },
        ticks: {
          callback: function(value: number, index: number, values: number[]) {
            return value.toLocaleString('en-US', { style: 'currency', currency: 'EUR' });
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';

            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Retirement Projection</h1>
      {projectionData.length > 0 ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <p>No data to display. Please adjust your input parameters.</p>
      )}
    </div>
  );
};

export default RetirementProjectionComponent;

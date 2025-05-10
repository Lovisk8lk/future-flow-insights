
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/contexts/FinanceContext";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

interface RetirementYearScreenProps {
  onValueChange: (isValid: boolean) => void;
}

const RetirementYearScreen: React.FC<RetirementYearScreenProps> = ({ onValueChange }) => {
  const { retirementData, updateRetirementData } = useFinance();
  const [selectedYear, setSelectedYear] = useState<string>(retirementData.retirementStartYear.toString());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 70 }, (_, i) => (currentYear + 1 + i).toString());

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    updateRetirementData({ retirementStartYear: parseInt(year) });
    onValueChange(true);
  };

  useEffect(() => {
    onValueChange(true); // Year selection is always valid
  }, [onValueChange]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Retirement Year</h2>
      <p className="text-gray-600 mb-6">
        When do you plan to retire? This helps us calculate how long your investment period will be.
      </p>
      
      <div className="mb-4">
        <Label htmlFor="retirementYear" className="mb-2 block">
          Select retirement year
        </Label>
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger id="retirementYear" className="w-full">
            <SelectValue placeholder="Select a year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RetirementYearScreen;

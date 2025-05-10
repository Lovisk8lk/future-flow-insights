
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/contexts/FinanceContext";

interface MonthlyDepositScreenProps {
  onValueChange: (isValid: boolean) => void;
}

const MonthlyDepositScreen: React.FC<MonthlyDepositScreenProps> = ({ onValueChange }) => {
  const { retirementData, updateRetirementData } = useFinance();
  const [value, setValue] = useState<string>(retirementData.monthlyDeposit.toString());
  const [isValid, setIsValid] = useState<boolean>(true);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    const numValue = parseFloat(newValue);
    const valid = !isNaN(numValue) && numValue >= 0;
    setIsValid(valid);
    
    if (valid) {
      updateRetirementData({ monthlyDeposit: numValue });
    }
    
    onValueChange(valid);
  };

  useEffect(() => {
    onValueChange(isValid);
  }, [isValid, onValueChange]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Monthly Investment</h2>
      <p className="text-gray-600 mb-6">
        How much can you invest per month? This is the amount you'll set aside regularly.
      </p>
      
      <div className="mb-4">
        <Label htmlFor="monthlyDeposit" className="mb-2 block">
          Monthly amount
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            €
          </span>
          <Input
            id="monthlyDeposit"
            type="number"
            value={value}
            onChange={handleValueChange}
            className="pl-7"
            placeholder="0"
            min="0"
            step="10"
          />
        </div>
        {!isValid && (
          <p className="text-red-500 text-sm mt-1">
            Please enter a valid amount
          </p>
        )}
      </div>
    </div>
  );
};

export default MonthlyDepositScreen;

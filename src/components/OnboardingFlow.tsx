
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowRight, ArrowLeft, TrendingUp, ChevronRight } from "lucide-react";
import { useFinance } from "../contexts/FinanceContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const OnboardingFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { updateRetirementData } = useFinance();
  const [step, setStep] = useState(0);
  const [monthlyDeposit, setMonthlyDeposit] = useState<string>("300");
  const [retirementStartYear, setRetirementStartYear] = useState<string>("2065");
  const [initialCapital, setInitialCapital] = useState<string>("0");
  const isMobile = useIsMobile();

  // Get current year for retirement year options
  const currentYear = new Date().getFullYear();
  const retirementYearOptions = Array.from(
    { length: 50 },
    (_, i) => currentYear + i + 5
  );

  const handleNext = () => {
    if (step === 3) {
      // Last step - save final values and complete onboarding
      updateRetirementData({
        monthlyDeposit: Number(monthlyDeposit) || 300,
        retirementStartYear: Number(retirementStartYear) || 2065,
        initialCapital: Number(initialCapital) || 0
      });
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col min-h-screen">
      {/* Progress indicator */}
      <div className="w-full bg-gray-100 h-1">
        <div
          className="bg-finance-black h-1 transition-all duration-300 ease-in-out"
          style={{ width: `${((step + 1) / 4) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col px-5 py-8">
        {step === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <div className="w-16 h-16 bg-finance-gray rounded-full flex items-center justify-center mb-8">
              <TrendingUp className="h-8 w-8 text-finance-black" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Welcome to your Analytics</h1>
            <p className="text-gray-600 mb-8 max-w-xs text-sm">
              Plan your financial future by forecasting your retirement savings.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center justify-center flex-1">
            <h1 className="text-xl font-bold mb-3">Monthly contribution</h1>
            <p className="text-gray-600 mb-6 text-center text-sm">
              How much can you invest per month?
            </p>
            <div className="w-full max-w-xs mb-6 relative">
              <Input
                type="number"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(e.target.value)}
                className="pr-8 text-lg h-12 text-center font-medium border-finance-gray"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                €
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center flex-1">
            <h1 className="text-xl font-bold mb-3">Target retirement year</h1>
            <p className="text-gray-600 mb-6 text-center text-sm">
              When do you plan to retire?
            </p>
            <div className="w-full max-w-xs mb-6">
              <Select
                value={retirementStartYear}
                onValueChange={(value) => setRetirementStartYear(value)}
              >
                <SelectTrigger className="w-full h-12 text-lg text-center">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {retirementYearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center flex-1">
            <h1 className="text-xl font-bold mb-3">Starting capital</h1>
            <p className="text-gray-600 mb-6 text-center text-sm">
              How much have you already saved for retirement?
            </p>
            <div className="w-full max-w-xs mb-6 relative">
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="pr-8 text-lg h-12 text-center font-medium border-finance-gray"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                €
              </span>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 mt-auto">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-1 border-finance-gray text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div></div>
          )}
          <Button 
            onClick={handleNext} 
            className="flex items-center gap-1 bg-finance-black hover:bg-finance-black/90 text-white"
          >
            {step === 3 ? "Complete" : "Next"}
            {step === 3 ? <ChevronRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;

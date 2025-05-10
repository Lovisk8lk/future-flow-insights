
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isNextDisabled?: boolean;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isNextDisabled = false,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Progress indicator */}
      <div className="w-full px-5 py-4">
        <div className="flex items-center gap-2 w-full">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < currentStep ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-5 border-t flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={currentStep === 0}
          className={`${currentStep === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="mr-2" size={18} />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          className="bg-finance-blue hover:bg-finance-blue/90 text-white"
        >
          {currentStep === totalSteps - 1 ? "Finish" : "Continue"}
          {currentStep !== totalSteps - 1 && <ChevronRight className="ml-2" size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingLayout;

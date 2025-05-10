
import React, { useState, useCallback } from "react";
import OnboardingLayout from "./OnboardingLayout";
import WelcomeScreen from "./WelcomeScreen";
import MonthlyDepositScreen from "./MonthlyDepositScreen";
import RetirementYearScreen from "./RetirementYearScreen";
import InitialCapitalScreen from "./InitialCapitalScreen";
import { useFinance } from "@/contexts/FinanceContext";

const Onboarding: React.FC = () => {
  const { setHasCompletedOnboarding } = useFinance();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(true);

  const handleNext = () => {
    if (currentStep === 3) {
      // Last step - complete onboarding
      setHasCompletedOnboarding(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setIsCurrentStepValid(true); // When going back, assume the step is valid
  };

  const handleStepValidation = useCallback((isValid: boolean) => {
    setIsCurrentStepValid(isValid);
  }, []);

  // Define the screens and their validation logic
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeScreen />;
      case 1:
        return <MonthlyDepositScreen onValueChange={handleStepValidation} />;
      case 2:
        return <RetirementYearScreen onValueChange={handleStepValidation} />;
      case 3:
        return <InitialCapitalScreen onValueChange={handleStepValidation} />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={4}
      onNext={handleNext}
      onPrevious={handlePrevious}
      isNextDisabled={!isCurrentStepValid}
    >
      {renderStep()}
    </OnboardingLayout>
  );
};

export default Onboarding;

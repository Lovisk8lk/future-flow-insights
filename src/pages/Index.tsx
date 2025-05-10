
import React, { useEffect } from "react";
import { FinanceProvider, useFinance } from "../contexts/FinanceContext";
import MainScreen from "../components/MainScreen";
import OnboardingFlow from "../components/OnboardingFlow";
import { supabase } from "@/integrations/supabase/client";

// Inner component to access context
const IndexContent = () => {
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useFinance();

  // Preload AI summary when app starts
  useEffect(() => {
    const preloadAiSummary = async () => {
      // Check if we already have a cached summary in the session
      const cachedSummary = sessionStorage.getItem('aiSummary');
      
      if (cachedSummary) {
        console.log("Already have cached AI summary from session storage");
        return;
      }
      
      console.log("Preloading AI summary at app startup");
      
      try {
        // Fire and forget - we don't need to wait for the result
        supabase.functions.invoke('generate-ai-summary', {
          body: {
            monthData: { month: "Current Month", totalAmount: 0, categories: [] },
            previousMonth: null
          }
        }).then(({ data, error }) => {
          if (error) {
            console.error("Error preloading AI summary:", error);
            return;
          }
          
          // Cache the generated text in session storage
          if (data?.generatedText) {
            console.log("Successfully preloaded AI summary");
            sessionStorage.setItem('aiSummary', data.generatedText);
          }
        });
      } catch (err) {
        console.error('Error triggering AI summary preload:', err);
      }
    };
    
    // Start preloading immediately at app startup
    preloadAiSummary();
  }, []);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto shadow-lg">
      {!hasCompletedOnboarding ? (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      ) : (
        <MainScreen />
      )}
    </div>
  );
};

const Index = () => {
  return (
    <FinanceProvider>
      <IndexContent />
    </FinanceProvider>
  );
};

export default Index;

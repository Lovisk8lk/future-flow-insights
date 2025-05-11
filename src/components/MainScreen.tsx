import React from "react";
import { useFinance } from "../contexts/FinanceContext";
import TabNavigation from "./TabNavigation";
import RetirementProjectionComponent from "./RetirementProjectionComponent";
import ExpenseOverviewComponent from "./ExpenseOverviewComponent";
import { Button } from "@/components/ui/button";
import { signInAsDemoUser, signOut } from "@/utils/authUtils";
import { supabase } from "@/integrations/supabase/client";

const MainScreen: React.FC = () => {
  const { activeTab } = useFinance();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const session = await supabase.auth.getSession();
      setIsAuthenticated(!!session.data.session);
    };
    
    checkAuth();
    
    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInAsDemoUser();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            Analytics
          </h1>
          {isAuthenticated ? (
            <Button onClick={handleSignOut} disabled={isLoading} variant="outline">
              Sign Out
            </Button>
          ) : (
            <Button onClick={handleSignIn} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Demo Login"}
            </Button>
          )}
        </div>
        <TabNavigation />
      </header>
      
      <main className="flex-1 overflow-auto pb-20">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-center mb-6">Please sign in to view your financial data.</p>
            <Button onClick={handleSignIn} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Demo Login"}
            </Button>
          </div>
        ) : activeTab === "retirement" ? (
          <RetirementProjectionComponent />
        ) : (
          <ExpenseOverviewComponent />
        )}
      </main>
    
    </div>
  );
};

export default MainScreen;

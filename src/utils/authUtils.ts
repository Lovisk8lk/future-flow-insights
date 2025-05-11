
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Clean up auth state to prevent limbo states
export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

// Sign in as demo user (we'll use a fixed test user)
export const signInAsDemoUser = async () => {
  try {
    // Clean up existing state
    cleanupAuthState();
    
    // Attempt global sign out first
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continue even if this fails
      console.log("Sign out failed, continuing anyway", err);
    }
    
    // Use demo@example.com / demopassword as our test account
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "demo@example.com",
      password: "demopassword",
    });
    
    if (error) throw error;
    
    toast({
      title: "Signed in successfully",
      description: "You are now signed in as a demo user",
    });
    
    return data.user;
  } catch (error) {
    console.error("Error signing in:", error);
    toast({
      title: "Sign in failed",
      description: "Please try again later",
      variant: "destructive",
    });
    return null;
  }
};

// Sign out current user
export const signOut = async () => {
  try {
    // Clean up auth state
    cleanupAuthState();
    
    // Attempt global sign out
    await supabase.auth.signOut({ scope: 'global' });
    
    toast({
      title: "Signed out successfully",
    });
    
    // Force page reload for a clean state
    window.location.href = '/';
  } catch (error) {
    console.error("Error signing out:", error);
    toast({
      title: "Sign out failed",
      description: "Please try again",
      variant: "destructive",
    });
  }
};

// Get current session
export const getCurrentSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};


import { supabase } from "@/integrations/supabase/client";

export type ExpenseTransaction = {
  id: string;
  bookingDate: string;
  side: string;
  amount: number;
  currency: string;
  type: string;
  mcc: string;
};

export const fetchExpensesByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('banking_sample_data')
    .select('*')
    .eq('userId', userId)
    .eq('type', 'CARD')

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }

  return data as ExpenseTransaction[];
};

export const fetchExpensesByMonth = async (userId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('banking_sample_data')
    .select('*')
    .eq('userId', userId)
    .eq('side', 'debt') // Only debt transactions (expenses)
    .gte('bookingDate', startDate)
    .lt('bookingDate', endDate);

  if (error) {
    console.error("Error fetching expenses by month:", error);
    return [];
  }

  return data as ExpenseTransaction[];
};

// Get available months from the data
export const fetchAvailableMonths = async (userId: string) => {
  const { data, error } = await supabase
    .from('banking_sample_data')
    .select('bookingDate')
    .eq('userId', userId)
    .order('bookingDate', { ascending: false });

  if (error) {
    console.error("Error fetching available months:", error);
    return [];
  }

  // Extract unique months from the data
  const uniqueMonths = new Set();
  const months = [];

  data.forEach(item => {
    if (item.bookingDate) {
      const date = new Date(item.bookingDate);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      
      if (!uniqueMonths.has(key)) {
        uniqueMonths.add(key);
        months.push({
          year,
          month,
          label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
      }
    }
  });

  return months;
};

// Group expenses by MCC and calculate sums
export const groupExpensesByMCC = (transactions: ExpenseTransaction[]) => {
  const groups: Record<string, { mcc: string, totalAmount: number }> = {};
  
  transactions.forEach(transaction => {
    if (!transaction.mcc) return;
    
    const mcc = transaction.mcc;
    
    if (!groups[mcc]) {
      groups[mcc] = {
        mcc,
        totalAmount: 0
      };
    }
    
    groups[mcc].totalAmount += Math.abs(transaction.amount || 0);
  });
  
  return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
};

// Group expenses by month and calculate sums
export const groupExpensesByMonth = (transactions: ExpenseTransaction[]) => {
  const groups: Record<string, { month: string, totalAmount: number }> = {};
  
  transactions.forEach(transaction => {
    if (!transaction.bookingDate) return;
    
    const date = new Date(transaction.bookingDate);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthDisplay = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: monthDisplay,
        totalAmount: 0
      };
    }
    
    groups[monthKey].totalAmount += Math.abs(transaction.amount || 0);
  });
  
  // Sort by date (most recent first)
  return Object.values(groups).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateB.getTime() - dateA.getTime();
  });
};

// Get MCC category name
export const getMCCCategory = (mcc: string): string => {
  // This is a simplified mapping - in a real app you would have a more comprehensive list
  const mccMap: Record<string, string> = {
    '5411': 'Grocery Stores',
    '5812': 'Restaurants',
    '5814': 'Fast Food',
    '4121': 'Taxi/Rideshare',
    '5541': 'Gas Stations',
    '5499': 'Food & Beverage',
    '5311': 'Department Stores',
    '5912': 'Pharmacies',
    '4112': 'Public Transportation',
    '7832': 'Entertainment',
    '7011': 'Hotels/Lodging',
    // Add more MCC codes as needed
  };
  
  return mccMap[mcc] || `Category ${mcc}`;
};

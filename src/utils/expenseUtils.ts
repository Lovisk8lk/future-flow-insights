
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
    eq('"userId"', userId)

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }

  console.log(data);
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

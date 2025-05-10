
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

// Get MCC category name - Updated with correct mapping
export const getMCCCategory = (mcc: string): string => {
  const mccMap: Record<string, string> = {
    '8043': 'Optometrists, Ophthalmologists',
    '5411': 'Grocery Stores / Supermarkets',
    '5651': 'Family Clothing Stores',
    '5661': 'Shoe Stores',
    '5912': 'Pharmacies',
    '5812': 'Restaurants',
    '4722': 'Travel Agencies and Tour Operators',
    '7991': 'Tourist Attractions and Exhibits',
    '5941': 'Sporting Goods Stores',
    '5311': 'Department Stores',
    '5462': 'Bakeries',
    '5921': 'Package Stores (Alcoholic Beverages)',
    '9399': 'Government Services (Miscellaneous)',
    '5499': 'Misc. Food Stores (Specialty, etc.)',
    '4814': 'Telecommunication Services',
    '5712': 'Furniture, Home Furnishings Stores',
    '7011': 'Hotels, Motels, Resorts',
    '4789': 'Transportation Services (Misc.)',
    '5970': 'Artist Supply / Craft Stores',
    '5814': 'Fast Food Restaurants',
    '5541': 'Gas Stations (with or without fuel)',
    '4215': 'Courier Services, Air or Ground',
    '5942': 'Book Stores',
    '7523': 'Parking Lots, Garages',
  };
  
  return mccMap[mcc] || `Category ${mcc}`;
};

// New function: Group expenses by month and then by category
export const groupExpensesByMonthAndCategory = (transactions: ExpenseTransaction[]) => {
  type CategoryGroup = {
    mcc: string;
    categoryName: string;
    totalAmount: number;
  };

  type MonthGroup = {
    month: string;
    monthKey: string;
    totalAmount: number;
    categories: CategoryGroup[];
  };

  const monthGroups: Record<string, MonthGroup> = {};
  
  transactions.forEach(transaction => {
    if (!transaction.bookingDate || !transaction.mcc) return;
    
    const date = new Date(transaction.bookingDate);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthDisplay = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const categoryName = getMCCCategory(transaction.mcc);
    
    // Create month group if it doesn't exist
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = {
        month: monthDisplay,
        monthKey,
        totalAmount: 0,
        categories: []
      };
    }
    
    // Update month total
    monthGroups[monthKey].totalAmount += Math.abs(transaction.amount || 0);
    
    // Find or create category in this month
    let categoryGroup = monthGroups[monthKey].categories.find(c => c.mcc === transaction.mcc);
    
    if (!categoryGroup) {
      categoryGroup = {
        mcc: transaction.mcc,
        categoryName,
        totalAmount: 0
      };
      monthGroups[monthKey].categories.push(categoryGroup);
    }
    
    // Update category total
    categoryGroup.totalAmount += Math.abs(transaction.amount || 0);
  });
  
  // Sort categories within each month by total amount
  Object.values(monthGroups).forEach(month => {
    month.categories.sort((a, b) => b.totalAmount - a.totalAmount);
  });
  
  // Sort months by date (most recent first)
  return Object.values(monthGroups).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateB.getTime() - dateA.getTime();
  });
};

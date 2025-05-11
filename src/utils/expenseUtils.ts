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
  try {
    const { data, error } = await supabase
      .from('banking_sample_data')
      .select('*')
      .eq('userId', userId)
      .eq('type', 'CARD');

    if (error) {
      console.error("Error fetching expenses:", error);
      return [];
    }

    return data as ExpenseTransaction[];
  } catch (error) {
    console.error("Exception fetching expenses:", error);
    return [];
  }
};

export const fetchExpensesByMonth = async (userId: string, startDate: string, endDate: string) => {
  try {
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
  } catch (error) {
    console.error("Exception fetching expenses by month:", error);
    return [];
  }
};

// Get available months from the data
export const fetchAvailableMonths = async (userId: string) => {
  try {
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
            label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            value: `${year}-${String(month + 1).padStart(2, '0')}`
          });
        }
      }
    });

    return months;
  } catch (error) {
    console.error("Exception fetching available months:", error);
    return [];
  }
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
  
  // Sort by date (chronological order - oldest first)
  return Object.values(groups).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });
};

// Get consolidated MCC category name - Updated with broader categories
export const getMCCCategory = (mcc: string): string => {
  // Mapping MCCs to broader category groups
  const mccCategoryMap: Record<string, string> = {
    // Clothing & Apparel
    '5651': 'Clothing & Apparel',
    '5661': 'Clothing & Apparel',
    
    // Food & Grocery
    '5411': 'Food & Grocery',
    '5462': 'Food & Grocery',
    '5499': 'Food & Grocery',
    
    // Dining & Restaurants
    '5812': 'Dining & Restaurants',
    '5814': 'Dining & Restaurants',
    
    // Health & Medical
    '8043': 'Health & Medical',
    '5912': 'Health & Medical',
    
    // Travel & Transportation
    '4722': 'Travel & Transportation',
    '7991': 'Travel & Transportation',
    '7011': 'Travel & Transportation',
    '4789': 'Travel & Transportation',
    '7523': 'Travel & Transportation',
    '4215': 'Travel & Transportation',
    
    // Shopping & Retail
    '5941': 'Shopping & Retail',
    '5311': 'Shopping & Retail',
    '5970': 'Shopping & Retail',
    '5712': 'Shopping & Retail',
    '5942': 'Shopping & Retail',
    
    // Alcohol & Beverages
    '5921': 'Alcohol & Beverages',
    
    // Government & Services
    '9399': 'Government & Services',
    
    // Utilities & Telecom
    '4814': 'Utilities & Telecom',
    
    // Automotive
    '5541': 'Automotive'
  };
  
  return mccCategoryMap[mcc] || `Other`;
};

// New function: Group expenses by month and then by consolidated category
export const groupExpensesByMonthAndCategory = (transactions: ExpenseTransaction[]) => {
  type CategoryGroup = {
    category: string;
    totalAmount: number;
    transactions: ExpenseTransaction[];
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
    let categoryGroup = monthGroups[monthKey].categories.find(c => c.category === categoryName);
    
    if (!categoryGroup) {
      categoryGroup = {
        category: categoryName,
        totalAmount: 0,
        transactions: []
      };
      monthGroups[monthKey].categories.push(categoryGroup);
    }
    
    // Update category total and add transaction to category group
    categoryGroup.totalAmount += Math.abs(transaction.amount || 0);
    categoryGroup.transactions.push(transaction);
  });
  
  // Sort categories within each month by total amount
  Object.values(monthGroups).forEach(month => {
    month.categories.sort((a, b) => b.totalAmount - a.totalAmount);
  });
  
  // Sort months by date (chronological order - oldest first)
  return Object.values(monthGroups).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });
};

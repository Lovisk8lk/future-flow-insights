
import React, { useEffect, useState } from "react";
import { useFinance } from "../contexts/FinanceContext";
import { ShoppingBag, Home, Car, Music, PieChart, Calendar } from "lucide-react";
import { 
  fetchExpensesByUserId, 
  ExpenseTransaction, 
  groupExpensesByMCC,
  groupExpensesByMonth,
  getMCCCategory
} from "../utils/expenseUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExpenseSummary = {
  mcc: string;
  totalAmount: number;
};

type MonthSummary = {
  month: string;
  totalAmount: number;
};

const ExpenseOverviewComponent: React.FC = () => {
  const { expenses } = useFinance();
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [mccGroups, setMccGroups] = useState<ExpenseSummary[]>([]);
  const [monthGroups, setMonthGroups] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'raw' | 'mcc' | 'month'>('mcc');
  const userId = "25e3564c-8bb9-4fdd-9dd7-cf0ec8c54c28";

  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);
      const data = await fetchExpensesByUserId(userId);
      setTransactions(data);
      
      // Group by MCC
      const mccGrouped = groupExpensesByMCC(data);
      setMccGroups(mccGrouped);
      
      // Group by Month
      const monthGrouped = groupExpensesByMonth(data);
      setMonthGroups(monthGrouped);
      
      setLoading(false);
    };

    loadExpenses();
  }, []);

  // Map icon names to components
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "shopping-bag":
        return <ShoppingBag size={20} />;
      case "home":
        return <Home size={20} />;
      case "car":
        return <Car size={20} />;
      case "music":
        return <Music size={20} />;
      default:
        return <ShoppingBag size={20} />;
    }
  };

  const renderTabs = () => (
    <div className="flex space-x-2 mb-4">
      <button 
        className={`px-4 py-2 flex items-center rounded-md ${viewMode === 'mcc' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setViewMode('mcc')}
      >
        <PieChart size={16} className="mr-2" /> Categories
      </button>
      <button 
        className={`px-4 py-2 flex items-center rounded-md ${viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setViewMode('month')}
      >
        <Calendar size={16} className="mr-2" /> Months
      </button>
      <button 
        className={`px-4 py-2 flex items-center rounded-md ${viewMode === 'raw' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => setViewMode('raw')}
      >
        Data
      </button>
    </div>
  );

  const renderRawData = () => (
    <div>
      <h4 className="font-semibold mb-3">Raw Expense Transactions</h4>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>MCC</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.slice(0, 10).map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>{transaction.bookingDate}</TableCell>
                <TableCell>{transaction.type || 'N/A'}</TableCell>
                <TableCell>{transaction.mcc || 'N/A'}</TableCell>
                <TableCell className="font-medium">
                  {transaction.amount ? `€${Math.abs(transaction.amount).toFixed(2)}` : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {transactions.length > 10 && (
          <div className="px-4 py-2 text-sm text-gray-500">
            Showing 10 of {transactions.length} transactions
          </div>
        )}
      </div>
    </div>
  );

  const renderMCCGroups = () => (
    <div>
      <h4 className="font-semibold mb-3">Expenses by Category</h4>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category (MCC)</TableHead>
              <TableHead>Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mccGroups.map((group, index) => (
              <TableRow key={index}>
                <TableCell>{getMCCCategory(group.mcc)} ({group.mcc})</TableCell>
                <TableCell className="font-medium">€{group.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderMonthGroups = () => (
    <div>
      <h4 className="font-semibold mb-3">Expenses by Month</h4>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthGroups.map((group, index) => (
              <TableRow key={index}>
                <TableCell>{group.month}</TableCell>
                <TableCell className="font-medium">€{group.totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col px-5 py-4">
      <h2 className="text-2xl font-bold mb-4">Expense Analysis</h2>
      
      <div className="mb-6">
        {renderTabs()}
        
        {loading ? (
          <div className="text-center py-4">Loading expenses data...</div>
        ) : (
          <>
            {viewMode === 'raw' && renderRawData()}
            {viewMode === 'mcc' && renderMCCGroups()}
            {viewMode === 'month' && renderMonthGroups()}
          </>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-xl font-bold mb-2">AI Summary</h3>
        <p className="mb-2">
          Your expenses are grouped by merchant category code (MCC) and by month. 
          {mccGroups.length > 0 && ` Your biggest expense category is ${getMCCCategory(mccGroups[0].mcc)} with €${mccGroups[0].totalAmount.toFixed(2)}.`}
        </p>
        <div className="h-10 mt-2">
          <svg viewBox="0 0 100 20" className="w-full h-full">
            <path 
              d="M0,10 Q10,15 20,7 T40,10 T60,5 T80,12 T100,8" 
              fill="none" 
              stroke="#4097FF" 
              strokeWidth="2" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ExpenseOverviewComponent;


import React, { useState, useRef, useEffect } from "react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, SendIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseTransaction, fetchExpensesByUserId, fetchAvailableMonths, groupExpensesByMonthAndCategory } from "@/utils/expenseUtils";
import { toast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const userId = "9c9fdff3-26d0-485e-9e28-c98e967c8bdb";

const AIChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hello! I'm your financial AI assistant. Ask me anything about your spending habits, budgeting advice, or how you can save money based on your transaction data."
    }
  ]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [monthData, setMonthData] = useState<any>(null);
  const [previousMonth, setPreviousMonth] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load transaction data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch transaction data
        const data = await fetchExpensesByUserId(userId);
        setTransactions(data);

        // Group by Month and Category
        const monthCategoryGroups = groupExpensesByMonthAndCategory(data);
        
        // Get most recent month
        if (monthCategoryGroups.length > 0) {
          const mostRecentMonth = monthCategoryGroups[monthCategoryGroups.length - 1];
          setMonthData(mostRecentMonth);
          
          // Get previous month if available
          if (monthCategoryGroups.length > 1) {
            setPreviousMonth(monthCategoryGroups[monthCategoryGroups.length - 2]);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Could not load your financial data",
          variant: "destructive",
        });
      }
    };
    
    loadData();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    setIsLoading(true);

    try {
      // Call our Supabase Edge Function with financial data context
      const { data: response, error } = await supabase.functions.invoke('generate-ai-summary', {
        body: {
          monthData,
          previousMonth,
          transactions: transactions.slice(0, 20), // Just send some recent transactions
          userQuestion: userMessage // Add the user's question
        }
      });
      
      if (error) {
        throw new Error(`Failed to get AI response: ${error.message}`);
      }

      // Add AI response to chat
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response?.generatedText || "I'm sorry, I couldn't generate a response."
      }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Could not get a response from the AI",
        variant: "destructive",
      });
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I encountered an error while processing your request."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col px-5 py-4 h-[calc(100vh-12rem)]">
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-black text-white rounded-tr-none"
                        : "bg-gray-100 text-black rounded-tl-none"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
            <Input
              placeholder="Ask about your finances..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatComponent;

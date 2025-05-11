
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('NEW_OPENAI_API_KEY');
const assistantId = "asst_DT8f807O7ztCGBxf5MFqaHdt";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('null');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { monthData, previousMonth, transactions, userQuestion } = await req.json();
    
    // If userQuestion is provided, we're in chat mode
    const isChat = !!userQuestion;
    
    if (!isChat) {
      // Handle non-chat mode as before, with direct OpenAI API call
      const prompt = `Analyze the attached customer transaction data to pinpoint under-used, duplicative, or low-value subscriptions that could be cancelled with minimal lifestyle impact—but do not display those findings.

If the user has multiple subscriptions within the same service category (e.g., two entertainment platforms), identify this overlap and suggest canceling one of them, based on usage or perceived redundancy. Emphasize that maintaining multiple similar services may offer limited added value, and one can likely meet their needs.

Output:
A single, concise, upbeat in-app message that:
	1.	Encourages the user by highlighting a positive recent spending habit.
	2.	Drives action by naming one specific low-value or duplicative subscription to cancel and hinting at its long-term benefit.
	3.	Clearly points out when the user subscribes to multiple services in the same category and suggests streamlining to reduce unnecessary spend.
	4.	Optionally recommends alternatives—other services the user already uses or cost-effective non-digital tools relevant to their city (e.g., transport passes).
    5.  Always mention only one recommendation at most.

Tone: Friendly, empowering, action-oriented, and urgent—celebrate progress and spotlight opportunity.

Monthly Data:
- Month: ${monthData?.month || 'Current Month'}
- Total Amount: €${monthData?.totalAmount ? monthData.totalAmount.toFixed(0) : '0'}`;

      // Add categories information if available
      if (monthData?.categories && monthData.categories.length > 0) {
        prompt += `\nTop Spending Categories:\n`;
        monthData.categories.slice(0, 3).forEach(category => {
          prompt += `- ${category.category}: €${category.totalAmount.toFixed(0)}\n`;
          console.log(`- ${category.category}: €${category.totalAmount.toFixed(0)}\n`);
        });
      } 

      // Add month-over-month comparison if available
      if (previousMonth) {
        const change = ((monthData?.totalAmount - previousMonth.totalAmount) / previousMonth.totalAmount) * 100;
        prompt += `\nMonth-over-month total expense change: ${change.toFixed(1)}% (previous month: €${previousMonth.totalAmount.toFixed(0)})`;
        console.log(`\nMonth-over-month total expense change: ${change.toFixed(1)}% (previous month: €${previousMonth.totalAmount.toFixed(0)})`);
      }

      // Add transaction details if available
      if (transactions && transactions.length > 0) {
        prompt += `\n\nRecent Transactions (up to 5):`;
        transactions.slice(0, 5).forEach((transaction, index) => {
          const amount = Math.abs(transaction.amount || 0);
          const date = transaction.bookingDate ? new Date(transaction.bookingDate).toLocaleDateString() : 'Unknown date';
          const description = transaction.transactionDescription || 'No description';
          prompt += `\n${index + 1}. ${date}: €${amount.toFixed(2)} - ${description}`;
          console.log(`\n${index + 1}. ${date}: €${amount.toFixed(2)} - ${description}`);
        });
      }

      prompt += `\n\n1 to 2 sentences maximum. Use a friendly, professional tone. No introduction or greeting. No placeholders`;
      
      console.log("Generated prompt with full context");

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful financial assistant that provides concise, personalized financial insights.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content;
      
      console.log("Generated text:", generatedText);

      return new Response(JSON.stringify({ generatedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'max-age=86400' },
      });
    } else {
      // Chat mode - use the Assistant API with your assistant ID
      
      // First, create a thread if one doesn't exist in the session
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({})
      });
      
      if (!threadResponse.ok) {
        throw new Error(`Failed to create thread: ${await threadResponse.text()}`);
      }
      
      const threadData = await threadResponse.json();
      const threadId = threadData.id;
      
      // Create a message with the user's question and financial context
      let messageContent = userQuestion;
      
      // Add financial data context if available
      if (monthData || previousMonth || (transactions && transactions.length > 0)) {
        messageContent += "\n\nHere's my current financial data for context:\n";
        
        if (monthData) {
          messageContent += `\nMonth: ${monthData.month || 'Current Month'}`;
          messageContent += `\nTotal Spending: €${monthData.totalAmount ? monthData.totalAmount.toFixed(0) : '0'}`;
          
          if (monthData.categories && monthData.categories.length > 0) {
            messageContent += `\n\nTop Spending Categories:`;
            monthData.categories.slice(0, 3).forEach(category => {
              messageContent += `\n- ${category.category}: €${category.totalAmount.toFixed(0)}`;
            });
          }
        }
        
        if (previousMonth) {
          const change = ((monthData?.totalAmount - previousMonth.totalAmount) / previousMonth.totalAmount) * 100;
          messageContent += `\n\nMonth-over-month change: ${change.toFixed(1)}% (previous: €${previousMonth.totalAmount.toFixed(0)})`;
        }
        
        if (transactions && transactions.length > 0) {
          messageContent += `\n\nRecent Transactions (up to 5):`;
          transactions.slice(0, 5).forEach((transaction, index) => {
            const amount = Math.abs(transaction.amount || 0);
            const date = transaction.bookingDate ? new Date(transaction.bookingDate).toLocaleDateString() : 'Unknown date';
            const description = transaction.transactionDescription || 'No description';
            messageContent += `\n${index + 1}. ${date}: €${amount.toFixed(2)} - ${description}`;
          });
        }
      }
      
      // Add the message to the thread
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          role: 'user',
          content: messageContent
        })
      });
      
      if (!messageResponse.ok) {
        throw new Error(`Failed to add message to thread: ${await messageResponse.text()}`);
      }
      
      // Run the assistant on the thread
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          assistant_id: assistantId
        })
      });
      
      if (!runResponse.ok) {
        throw new Error(`Failed to create run: ${await runResponse.text()}`);
      }
      
      const runData = await runResponse.json();
      const runId = runData.id;
      
      // Poll for the run completion
      let run;
      let attempts = 0;
      const maxAttempts = 15; // Limit polling attempts
      
      while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
        
        const runStatusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'OpenAI-Beta': 'assistants=v1'
          }
        });
        
        if (!runStatusResponse.ok) {
          throw new Error(`Failed to get run status: ${await runStatusResponse.text()}`);
        }
        
        run = await runStatusResponse.json();
        
        if (run.status === 'completed') {
          break;
        } else if (['failed', 'cancelled', 'expired'].includes(run.status)) {
          throw new Error(`Run ended with status: ${run.status}`);
        }
      }
      
      if (!run || run.status !== 'completed') {
        throw new Error('Run timed out or did not complete successfully');
      }
      
      // Get the assistant's response
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });
      
      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${await messagesResponse.text()}`);
      }
      
      const messagesData = await messagesResponse.json();
      
      // Find the assistant's most recent response
      const assistantMessages = messagesData.data.filter(msg => msg.role === 'assistant');
      
      if (assistantMessages.length === 0) {
        throw new Error('No assistant response found');
      }
      
      const latestMessage = assistantMessages[0];
      let generatedText = '';
      
      // Extract text content from the message
      if (latestMessage.content && latestMessage.content.length > 0) {
        for (const contentPart of latestMessage.content) {
          if (contentPart.type === 'text') {
            generatedText += contentPart.text.value;
          }
        }
      }
      
      return new Response(JSON.stringify({ generatedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in generate-ai-summary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

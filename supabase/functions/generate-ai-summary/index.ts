
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { monthData, previousMonth, transactions } = await req.json();
    
    // Create a meaningful prompt based on the expense data
    let prompt = `Analyze the attached customer transaction data to pinpoint under-used, duplicative, or low-value subscriptions that could be cancelled with minimal lifestyle impact—but do not display those findings.

If the user has multiple subscriptions within the same service category (e.g., two entertainment platforms), identify this overlap and suggest canceling one of them, based on usage or perceived redundancy. Emphasize that maintaining multiple similar services may offer limited added value, and one can likely meet their needs.

Output:
A single, concise, upbeat in-app message that:
	1.	Encourages the user by highlighting a positive recent spending habit (no numbers).
	2.	Drives action by naming one specific low-value or duplicative subscription to cancel and hinting at its long-term benefit.
	3.	Clearly points out when the user subscribes to multiple services in the same category and suggests streamlining to reduce unnecessary spend.
	4.	Optionally recommends alternatives—other services the user already uses or cost-effective non-digital tools relevant to their city (e.g., transport passes).

Tone: Friendly, empowering, action-oriented, and urgent—celebrate progress and spotlight opportunity.

Monthly Data:
- Month: ${monthData.month || 'Current Month'}
- Total Amount: €${monthData.totalAmount ? monthData.totalAmount.toFixed(0) : '0'}
`;

    // Add categories information if available
    if (monthData.categories && monthData.categories.length > 0) {
      prompt += `\nTop Spending Categories:\n`;
      monthData.categories.slice(0, 3).forEach(category => {
        prompt += `- ${category.category}: €${category.totalAmount.toFixed(0)}\n`;
        console.log(`- ${category.category}: €${category.totalAmount.toFixed(0)}\n`);
      });
    } else {console.log('not month data received')}

    // Add month-over-month comparison if available
    if (previousMonth) {
      const change = ((monthData.totalAmount - previousMonth.totalAmount) / previousMonth.totalAmount) * 100;
      prompt += `\nMonth-over-month total expense change: ${change.toFixed(1)}% (previous month: €${previousMonth.totalAmount.toFixed(0)})`;
      console.log(`\nMonth-over-month total expense change: ${change.toFixed(1)}% (previous month: €${previousMonth.totalAmount.toFixed(0)})`);
    } else {console.log('not previous month data received')}

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
    } else {console.log('not transaction data received')}

    prompt += `\n\n1 to 2 sentences maximum. Use a friendly, professional tone. No introduction or greeting.`;

    // Log prompt for debugging
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
          { role: 'system', content: 'You are a helpful financial assistant that provides concise, personalized financial insights.' },
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
  } catch (error) {
    console.error('Error in generate-ai-summary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

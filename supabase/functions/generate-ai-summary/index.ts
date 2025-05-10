
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { monthData, previousMonth } = await req.json();
    
    // Create a meaningful prompt based on the expense data
    let prompt = `Analyze the following monthly expense data and provide a concise, personalized financial summary (about 2-3 sentences):

Monthly Data:
- Month: ${monthData.month || 'Current Month'}
- Total Amount: €${monthData.totalAmount ? monthData.totalAmount.toFixed(0) : '0'}
`;

    // Add categories information if available
    if (monthData.categories && monthData.categories.length > 0) {
      prompt += `\nTop Spending Categories:\n`;
      monthData.categories.slice(0, 3).forEach(category => {
        prompt += `- ${category.category}: €${category.totalAmount.toFixed(0)}\n`;
      });
    }

    // Add month-over-month comparison if available
    if (previousMonth) {
      const change = ((monthData.totalAmount - previousMonth.totalAmount) / previousMonth.totalAmount) * 100;
      prompt += `\nMonth-over-month total expense change: ${change.toFixed(1)}% (previous month: €${previousMonth.totalAmount.toFixed(0)})`;
    }

    prompt += `\n\nProvide a short, insightful analysis of spending patterns, highlight any significant changes between months, and suggest one simple actionable tip for better financial management.
Keep your response very concise - 2 to 3 sentences maximum. Use a friendly, professional tone. No introduction or greeting.`;

    console.log("Calling OpenAI with prompt:", prompt);

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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ai-summary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

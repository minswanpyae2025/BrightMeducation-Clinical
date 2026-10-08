// Vercel Serverless Function: api/ai-convo.ts
// Free-tier compatible serverless endpoint for AI Voice & Clinical OSCE dialogue

export const config = {
  runtime: 'edge', // Runs fast on Vercel Edge Free Tier
};

interface RequestBody {
  candidateText: string;
  stationId: string;
  category: 'history_taking' | 'physical_examination';
  subcategory: 'cvs' | 'respi' | 'abdomen' | 'cns';
  conversationHistory?: Array<{ sender: string; text: string }>;
}

export default async function handler(req: Request) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { candidateText, stationId, category, subcategory } = body;

    if (!candidateText) {
      return new Response(JSON.stringify({ error: 'candidateText is required' }), {
        status: 400,
        headers,
      });
    }

    // Placeholder: Hook up to OpenAI / ElevenLabs / Gemini voice endpoint here
    // e.g. const response = await fetch('https://api.openai.com/v1/chat/completions', ...)

    return new Response(
      JSON.stringify({
        success: true,
        stationId,
        category,
        subcategory,
        patientReply: `Doctor, regarding that: ${candidateText.trim()} — it still feels very tight and uncomfortable right now.`,
        suggestedGesture: 'clutch_chest',
        rubricTriggered: null,
      }),
      { status: 200, headers }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers }
    );
  }
}

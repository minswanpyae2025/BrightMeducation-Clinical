// Vercel Serverless Function: api/tts.ts
// On-demand Google Cloud Text-to-Speech (TTS) for Burmese (my-MM) & English

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
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
    const { text, languageCode = 'my-MM', gender = 'MALE' } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400,
        headers,
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;

    if (apiKey) {
      const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
      const response = await fetch(ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: languageCode,
            ssmlGender: gender,
            name: languageCode === 'my-MM' ? 'my-MM-Standard-A' : 'en-US-Neural2-D',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: 0.0,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return new Response(
          JSON.stringify({
            success: true,
            audioContent: data.audioContent,
            audioUri: `data:audio/mp3;base64,${data.audioContent}`,
            provider: 'google-cloud-tts',
          }),
          { status: 200, headers }
        );
      }
    }

    // Graceful fallback flag for frontend Web Speech synthesis
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        message: 'Google Cloud API key not set in environment. Falling back to browser speech.',
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'TTS Error' }),
      { status: 500, headers }
    );
  }
}

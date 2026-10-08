// Vercel Serverless Function: api/stt.ts
// On-demand Google Cloud Speech-to-Text (STT) for Burmese (my-MM) & English

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
    const { audioContent, languageCode = 'my-MM' } = await req.json();

    if (!audioContent) {
      return new Response(JSON.stringify({ error: 'audioContent required' }), {
        status: 400,
        headers,
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY;

    if (apiKey) {
      const sttUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
      const response = await fetch(sttUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: languageCode,
            alternativeLanguageCodes: ['en-US', 'my-MM'],
          },
          audio: {
            content: audioContent,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || '';
        return new Response(
          JSON.stringify({
            success: true,
            transcript,
            provider: 'google-cloud-stt',
          }),
          { status: 200, headers }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        message: 'Google Cloud STT key not set. Falling back to browser SpeechRecognition.',
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'STT Error' }),
      { status: 500, headers }
    );
  }
}

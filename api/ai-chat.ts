// Vercel Serverless Edge Function: api/ai-chat.ts
// Google Cloud / Gemini 3.8 Flash Clinical AI Brain with dynamic Template Grounding & Token Optimization

export const config = {
  runtime: 'edge',
};

interface ClinicalTriggerItem {
  triggers: string[];
  response: string;
  response_my: string;
  gesture?: string;
  rubricId?: string;
  category?: string;
}

interface RequestBody {
  candidateText: string;
  language?: 'my' | 'en';
  stationId: string;
  stationTemplate: {
    stationId?: string;
    mainCategory?: string;
    subCategory?: string;
    title?: string;
    title_my?: string;
    patientName: string;
    patientName_my: string;
    age: number;
    gender?: string;
    occupation?: string;
    appearance?: string;
    chiefComplaint: string;
    chiefComplaint_my: string;
    defaultGesture?: string;
    setting?: string;
    situation?: string;
    triageNote?: string;
    vitals?: any;
    scriptTriggers?: ClinicalTriggerItem[];
    modelSummary?: any;
  };
  history?: Array<{ sender: string; text: string }>;
}

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
    const body: RequestBody = await req.json();
    const { candidateText, stationTemplate, history = [] } = body;

    if (!candidateText || !stationTemplate) {
      return new Response(JSON.stringify({ error: 'candidateText and stationTemplate required' }), {
        status: 400,
        headers,
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    const defaultGesture = stationTemplate.defaultGesture || 'nodding';
    const triggersList = stationTemplate.scriptTriggers || [];

    // Token-optimized recent conversation history (last 4 turns)
    const recentHistory = history.slice(-4).map((h) => `${h.sender}: ${h.text}`).join('\n');

    // System prompt dynamically grounded in the specific station template
    const systemPrompt = `You are a standardized patient actor roleplaying in an OSCE clinical medical exam.
Station: ${stationTemplate.title || ''} (${stationTemplate.subCategory || ''})
Patient Identity: ${stationTemplate.patientName_my || stationTemplate.patientName}, ${stationTemplate.age} years old (${stationTemplate.gender || 'male'}).
Chief Complaint: ${stationTemplate.chiefComplaint_my} (${stationTemplate.chiefComplaint})
Clinical Setting: ${stationTemplate.setting || ''}
Situation: ${stationTemplate.situation || ''}
Vitals: ${JSON.stringify(stationTemplate.vitals || {})}

AVAILABLE CLINICAL FACTS (STRICT GROUND TRUTH):
${triggersList.map((t, idx) => `Fact ${idx + 1} [Keywords: ${t.triggers?.slice(0, 4).join(', ')}]:
- English: "${t.response}"
- Burmese: "${t.response_my}"
- Gesture: "${t.gesture || defaultGesture}"`).join('\n\n')}

DIAGNOSIS CONTEXT:
Primary: ${stationTemplate.modelSummary?.primaryDiagnosis || ''}

RULES FOR CLINICAL FIDELITY & ZERO HALLUCINATION:
1. You MUST speak in authentic, natural Burmese (မြန်မာစကားပြော).
2. Answer STRICTLY using the clinical facts above. NEVER invent symptoms, diseases, surgeries, or family deaths not present in this station's template.
3. If asked about a symptom not mentioned in the template, answer naturally as this patient that you do not experience it.
4. Keep answers concise: 1 to 2 short sentences.
5. Return strictly valid JSON:
{
  "replyBurmese": "Burmese spoken response here",
  "replyEnglish": "English translation here",
  "gesture": "${defaultGesture}",
  "rubricMatched": string | null
}`;

    // If Google Cloud API key is configured, call Gemini Flash API
    if (apiKey) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\nRecent Dialogue:\n${recentHistory}\n\nCandidate/Doctor asks: "${candidateText}"\n\nReturn JSON:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.15, // Low temperature for deterministic adherence to template
            maxOutputTokens: 200, // Token optimization floor
            responseMimeType: 'application/json',
          },
        }),
      });

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          try {
            const parsed = JSON.parse(rawJsonText);
            return new Response(
              JSON.stringify({
                success: true,
                replyBurmese: parsed.replyBurmese,
                replyEnglish: parsed.replyEnglish,
                gesture: parsed.gesture || defaultGesture,
                rubricMatched: parsed.rubricMatched || null,
                provider: 'google-cloud-gemini-flash',
              }),
              { status: 200, headers }
            );
          } catch {}
        }
      }
    }

    // Dynamic High-Fidelity Template Matcher Fallback (Zero Hallucination Guaranteed)
    const lower = candidateText.toLowerCase();
    const patientComplaintMy = stationTemplate.chiefComplaint_my || 'နေမကောင်းပါဘူး ဆရာ';
    const patientComplaintEn = stationTemplate.chiefComplaint || 'I am feeling quite unwell, doctor';

    let replyBurmese = `${patientComplaintMy} ဆရာ ဘာကို ထပ်သိချင်ပါသလဲ?`;
    let replyEnglish = `${patientComplaintEn}. What else would you like to know, doctor?`;
    let gesture = defaultGesture;
    let rubricMatched: string | null = null;

    if (triggersList.length > 0) {
      for (const trig of triggersList) {
        if (trig.triggers?.some((k: string) => lower.includes(k.toLowerCase()))) {
          replyBurmese = trig.response_my || trig.response;
          replyEnglish = trig.response;
          gesture = trig.gesture || defaultGesture;
          rubricMatched = trig.rubricId || null;
          break;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        replyBurmese,
        replyEnglish,
        gesture,
        rubricMatched,
        provider: 'template-grounded-engine',
      }),
      { status: 200, headers }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Server error' }),
      { status: 500, headers }
    );
  }
}

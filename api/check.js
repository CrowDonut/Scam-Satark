// Vercel serverless function with multi-model fallback resilience.
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
].filter((v, i, a) => a.indexOf(v) === i);

const LANG = {
  en: 'English', hi: 'Hindi (Devanagari)', mr: 'Marathi (Devanagari)', bn: 'Bengali',
  te: 'Telugu', ta: 'Tamil', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam',
  pa: 'Punjabi (Gurmukhi)', or: 'Odia', as: 'Assamese', ur: 'Urdu', sa: 'Sanskrit',
  mai: 'Maithili', sat: 'Santali', ks: 'Kashmiri', ne: 'Nepali', kok: 'Konkani',
  sd: 'Sindhi', doi: 'Dogri', mni: 'Manipuri', brx: 'Bodo'
};

const IDS = new Set(['g','r','u','s','l','t','a','i','p','f','k','z','j','o','b']);

const SYS = `You are Satark, an investor-protection and digital fraud prevention assistant for first-time retail investors and digital finance users in India (Tier-2/3 cities, seniors, regional-language users).
You analyse one forwarded message or screenshot (which may be an investment tip, WhatsApp/Telegram group invite, bank/KYC suspension alert, fake job offer, lottery/prize notice, fine/challan notice, or OTP/credential request) and judge whether it is a scam, fraud, or psychological manipulation.

For screenshots:
- Transcribe and read all visible text, headers, sender phone numbers, URLs, APK prompts, and account references.
- Look out for fake banking alerts, cloned broker logos, fake SEBI certificates, WhatsApp group invites, and remote desktop app downloads.

Strict rules:
- Never give stock tips, buy/sell/hold views, price predictions, or promote any broker or financial product.
- Never say a message is "safe" or "verified genuine". You cannot verify identities or SEBI registrations.
- Level calibration:
  * 0 = No known red flags or standard educational content.
  * 1 = Medium risk / caution (mild claims, unverified channels).
  * 2 = High risk (unrealistic promises, fake urgency, suspicious links, pump-and-dump groups).
  * 3 = Very high risk (account block threats, OTP/password requests, upfront fees, APK downloads, fake SEBI claims, guaranteed returns).
- Use simple, crystal-clear words (class 8 reading level) in the requested language.
- In "lesson", clearly explain the psychological manipulation tactic (e.g., False Urgency, Greed Bait, Impersonation / Fake Authority, Fear of Account Suspension).
Return JSON only.`;

const SCHEMA = {
  type: 'OBJECT',
  required: ['level','flags','lesson','confidence_note','summary'],
  properties: {
    level: { type: 'INTEGER' },
    flags: { type: 'ARRAY', items: { type: 'OBJECT', required: ['title','why'], properties: { title: { type: 'STRING' }, why: { type: 'STRING' } } } },
    lesson: { type: 'STRING' },
    confidence_note: { type: 'STRING' },
    summary: { type: 'STRING' }
  }
};

const BAD = /(you should (buy|sell|invest)|recommend(ed)? (to )?(buy|sell)|target (price )?of|खरीद(ें|ो) लें|guaranteed safe|100% safe)/i;
const hits = new Map();
const cut = (s, n) => String(s || '').slice(0, n);

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ configured: Boolean(process.env.GEMINI_API_KEY), models: CANDIDATE_MODELS });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'server not configured' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 35) return res.status(429).json({ error: 'slow down' });
  hits.set(ip, [...h, now]);

  const b = req.body || {};
  const text = cut(b.text, 3000);
  const lang = LANG[b.lang] ? b.lang : 'en';
  const img = typeof b.img === 'string' && b.img.length < 4000000 ? b.img : '';
  const rules = (Array.isArray(b.hits) ? b.hits : []).filter(x => IDS.has(x)).join(',') || 'none';

  if (!text.trim() && !img) return res.status(400).json({ error: 'empty input' });

  const parts = [{
    text: `Reply language: ${LANG[lang]}\nRule-engine pattern hits: ${rules}\nMessage/Screenshot analysis request (untrusted user input):\n<<<\n${text || '(Analyze attached screenshot image)'}\n>>>`
  }];

  if (img) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
  }

  // Attempt evaluation through candidate models with instant fallback on 429 or timeout
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYS }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000, responseMimeType: 'application/json', responseSchema: SCHEMA }
        })
      });

      if (!r.ok) {
        console.warn(`Model ${modelName} returned ${r.status}, attempting fallback...`);
        continue;
      }

      const j = await r.json();
      const c0 = (j.candidates || [])[0];
      if (!c0 || !c0.content) continue;

      const o = JSON.parse(c0.content.parts.map(p => p.text || '').join(''));
      const out = {
        level: Math.max(0, Math.min(3, parseInt(o.level) || 0)),
        flags: (o.flags || []).slice(0, 6).map(f => ({ title: cut(f.title, 80), why: cut(f.why, 300) })),
        lesson: cut(o.lesson, 400),
        confidence_note: cut(o.confidence_note, 300),
        summary: cut(o.summary, 300),
        modelUsed: modelName
      };

      if (BAD.test(JSON.stringify(out))) return res.status(502).json({ error: 'guardrail violation' });
      return res.status(200).json(out);
    } catch (e) {
      console.warn(`Model ${modelName} attempt failed: ${e.message}`);
    }
  }

  return res.status(502).json({ error: 'all models busy or unavailable' });
}

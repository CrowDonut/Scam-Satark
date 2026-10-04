// Translates the app's UI strings once per language; the browser caches the result.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const LN = { mr: 'Marathi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi (Gurmukhi)', or: 'Odia', as: 'Assamese', ur: 'Urdu' };
const hits = new Map();
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'server not configured' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 6) return res.status(429).json({ error: 'slow down' });
  hits.set(ip, [...h, now]);
  const { lang, strings } = req.body || {};
  if (!LN[lang] || !strings || typeof strings !== 'object') return res.status(400).json({ error: 'bad request' });
  const keys = Object.keys(strings);
  if (keys.length > 80 || JSON.stringify(strings).length > 9000) return res.status(400).json({ error: 'too large' });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', signal: AbortSignal.timeout(25000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `Translate the JSON values from English to ${LN[lang]} for first-time investors in India. Use simple everyday words. Keep every key, HTML tags, the placeholders {n} and {m}, the word Satark, URLs, emojis and numbers (like 1930) unchanged. Return only the same JSON.` }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(strings) }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8000, responseMimeType: 'application/json' } })
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    const j = await r.json();
    const o = JSON.parse(j.candidates[0].content.parts.map(p => p.text || '').join(''));
    const out = {};
    for (const k of keys) { const v = o[k]; if (typeof v === 'string' && v.length < 900 && !/<script|onerror|onload|javascript:/i.test(v)) out[k] = v; }
    return res.status(200).json(out);
  } catch (e) { console.error('translate failed', e); return res.status(502).json({ error: 'translate unavailable' }); }
}

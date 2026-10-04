// Speech-to-text via Gemini with multi-model fallback resilience
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest'
].filter((v, i, a) => a.indexOf(v) === i);

const LN = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu',
  gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi (Gurmukhi script)',
  or: 'Odia', as: 'Assamese', ur: 'Urdu', sa: 'Sanskrit', mai: 'Maithili',
  sat: 'Santali', ks: 'Kashmiri', ne: 'Nepali', kok: 'Konkani', sd: 'Sindhi',
  doi: 'Dogri', mni: 'Manipuri', brx: 'Bodo'
};
const hits = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'server not configured' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0] || 'x', now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 35) return res.status(429).json({ error: 'slow down' });
  hits.set(ip, [...h, now]);

  const { lang, audio, mimeType } = req.body || {};
  if (!LN[lang] || typeof audio !== 'string' || audio.length < 50 || audio.length > 5000000) {
    return res.status(400).json({ error: 'bad audio data' });
  }

  const audioMime = (typeof mimeType === 'string' && mimeType.includes('/')) ? mimeType.split(';')[0] : 'audio/webm';

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
        method: 'POST',
        signal: AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [
            { text: `Transcribe this spoken audio recording accurately into text. The speaker is speaking in ${LN[lang]} (or mixed ${LN[lang]} and English). Output ONLY the final transcription text in ${LN[lang]} native script without any meta commentary. If no clear speech, return empty string.` },
            { inlineData: { mimeType: audioMime, data: audio } }
          ] }],
          generationConfig: { temperature: 0, maxOutputTokens: 2000 }
        })
      });

      if (!r.ok) {
        console.warn(`Transcribe model ${modelName} returned ${r.status}, attempting fallback...`);
        continue;
      }

      const j = await r.json();
      const text = ((j.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('').trim().slice(0, 2500);
      return res.status(200).json({ text });
    } catch (e) {
      console.warn(`Transcribe model ${modelName} failed: ${e.message}`);
    }
  }

  return res.status(502).json({ error: 'transcription service busy' });
}

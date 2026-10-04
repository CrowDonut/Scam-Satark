# ScamSatark (स्कैम सतर्क)
### National Investor Resilience & Digital Fraud Interception Infrastructure
**Built for SANGYAN: Investor Resilience Hackathon 2026**
*In collaboration with Securities and Exchange Board of India (SEBI), National Securities Depository Limited (NSDL), and Science & Technology Council, IIT (BHU) Varanasi.*

---

## 🌟 Executive Summary
India's retail investor base has crossed **16+ crore Demat accounts**, with **over 70% of incremental retail participation emerging from Tier-2, Tier-3, and rural Bharat**. However, access to financial markets has outrun investor defense mechanisms. First-time investors are daily bombarded with Telegram pump-and-dump channels, cloned broker portals, fake SEBI registration claims, urgent account-suspension phishing SMS, and screen-sharing remote APKs.

**ScamSatark** is a lightweight, zero-login, public-good digital defense infrastructure that empowers first-time and regional retail investors to detect, deconstruct, and intercept financial fraud **before money changes hands**.

---

## 🎯 Track Alignment
- **Primary Track — Track A (Digital Fraud & Scam Resilience):** Real-time claim verifier and WhatsApp/Telegram tip-group profiler cross-checking 15+ known manipulation vectors (guaranteed returns, fake KYC block alerts, remote desktop APKs, credential harvesting).
- **Secondary Track — Track B (Investor Awareness & Grievance Redressal):** 1-Click structured **Incident Dossier Generation** formatted directly for **SEBI SCORES 2.0** and the **1930 National Cybercrime Reporting Portal**.
- **Secondary Track — Track C & E (Investor Education & Misinformation Literacy for Bharat):** Plain-language analogies (8th-grade reading level) deconstructing cognitive manipulation tactics (Artificial Urgency, Greed Baits, Fake Authority).

---

## 🛡️ Mandatory Guardrail Compliance
ScamSatark is built strictly as public-good investor-protection infrastructure:
- 🚫 **Zero Speculative / Commercial Advice:** Strictly zero stock tips, buy/sell/hold calls, price targets, or algorithmic signals.
- 🚫 **Zero Monetization Funnels:** No broking commissions, margin nudges, or paid subscription upsells.
- 🚫 **Privacy by Design:** Zero harvesting of private SMS, OTPs, or PII. Operates without requiring logins.
- 🚫 **Calibrated Uncertainty:** Never provides false reassurance or claims an unverified source is "100% safe".

---

## ⚡ Core Technical Features & Architecture
1. **Full 22 Official Indian Languages (+ English) Support:**
   - Instant 0ms language switching across all 22 Eighth Schedule languages (Hindi, Marathi, Bengali, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Sanskrit, Maithili, Santali, Kashmiri, Nepali, Konkani, Sindhi, Dogri, Manipuri, Bodo) + English with pre-bundled native dictionaries.
2. **Dual-Engine Speech Recognition (Voice-In):**
   - Web Speech API real-time regional continuous recognition with seamless fallback to Gemini multimodal audio transcription (`/api/transcribe`).
3. **Multimodal Screenshot OCR & Visual Inspection:**
   - Analyzes screenshots of WhatsApp chats, broker app lookalikes, fake SEBI certificates, and payment requests.
4. **Regional Text-to-Speech (Voice-Out):**
   - Reads out verdicts, fraud explanations, and protection steps in the user's native regional language with active audio stop controls.
5. **Multi-Model Fallback Cascade:**
   - Serverless architecture utilizing `gemini-3.5-flash-lite` with automatic fallback to `gemini-flash-latest` and sub-millisecond client-side regex heuristics for guaranteed 100% demo uptime.

---

## 🚀 Quick Deployment & Local Run

### 1. Environment Configuration
Create a `.env.local` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

### 2. Local Development
```bash
npm install -g vercel
vercel dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Deployment
```bash
vercel --prod
```
Add `GEMINI_API_KEY` and `GEMINI_MODEL` in your Vercel Project Environment Variables.

---

## 👥 SANGYAN Hackathon Submission Checklist
- ✅ **Live Prototype Link:** Deployable on Vercel (`vercel --prod`)
- ✅ **Core User Journey:** User receives scam message $\rightarrow$ Pastes / Speaks / Uploads Screenshot $\rightarrow$ Real-time localized fraud deconstruction $\rightarrow$ 1-Click SEBI SCORES dossier generation & WhatsApp warning share.
- ✅ **Guardrail Compliance:** 100% Public Good, Non-commercial, Zero PII storage.

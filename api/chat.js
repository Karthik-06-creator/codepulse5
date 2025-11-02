import OpenAI from "openai";

// Initialize OpenAI client with API key validation
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is not set");
}

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// very small in-memory rate limiter (works for Vercel demo; for production use redis / DB)
const RATE_MAP = new Map();
const MAX_PER_MIN = 8;

function checkRate(ip) {
  const now = Date.now();
  const entry = RATE_MAP.get(ip) || { count: 0, t0: now };
  // reset every 60s
  if (now - entry.t0 > 60_000) {
    entry.count = 1;
    entry.t0 = now;
  } else {
    entry.count++;
  }
  RATE_MAP.set(ip, entry);
  return entry.count <= MAX_PER_MIN;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Check if OpenAI API key is configured
    if (!openai || !process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      res.status(500).json({ 
        error: "Server configuration error", 
        detail: "OpenAI API key is not set. Please configure OPENAI_API_KEY environment variable." 
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Only POST method allowed" });
      return;
    }

    // Parse request body if needed - Vercel may already parse it
    let body = req.body;
    if (!body) {
      // Handle case where body might be undefined
      body = {};
    }
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.status(400).json({ error: "Invalid JSON in request body" });
        return;
      }
    }
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: "Request body must be a JSON object" });
      return;
    }

    // Extract IP address - handle forwarded-for header which may contain multiple IPs
    let ip = "local";
    if (req.headers["x-forwarded-for"]) {
      ip = req.headers["x-forwarded-for"].split(",")[0].trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    }
    if (!checkRate(ip)) {
      res.status(429).json({ error: "Too many requests — slow down a bit." });
      return;
    }

    const { message } = body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message required and must be a non-empty string" });
      return;
    }

    // instruct model to return structured JSON to simplify parsing
    // Note: When using response_format: json_object, the system message must explicitly request JSON
    const system = `You are MindEase, an empathetic mental health assistant. Follow these rules:
1) Respond kindly and succinctly.
2) Return a JSON object ONLY (no extra commentary) with these exact keys:
   - "reply": a short empathetic helpful response (max ~220 words)
   - "mood": one of ["calm","sad","anxious","angry","neutral","confused","urgent"]
   - "tone": one of ["calming","encouraging","informational","reflective"]
   - "resources": an array of objects { "title": "...", "url": "..." } with up to 3 helpful resources
   - "action": optional quick action string like "breathing_exercise" or "call_hotline" or null
3) NEVER provide medical diagnosis or promise outcomes. For crisis/urgent mood, include hotline resources and gentle instruction to seek immediate help.
4) Return ONLY valid JSON, no other text.`;

    const messages = [
      { role: "system", content: system },
      { role: "user", content: `User message: ${message}` }
    ];

    // call OpenAI Chat Completions
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 400,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      const errorMessage = openaiError?.message || openaiError?.toString() || "Failed to get response from OpenAI";
      res.status(500).json({ 
        error: "OpenAI API error", 
        detail: errorMessage
      });
      return;
    }

    const text = completion?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      res.status(500).json({ error: "No response from model" });
      return;
    }

    // try parse JSON: model instructed to return JSON only
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      // fallback: attempt to extract JSON substring
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch (parseErr) {
          res.status(500).json({ error: "Failed to parse model output", raw: text.substring(0, 200) });
          return;
        }
      } else {
        res.status(500).json({ error: "Failed to parse model output", raw: text.substring(0, 200) });
        return;
      }
    }

    // sanitize basic fields
    parsed.reply = (parsed.reply || "").toString().trim();
    if (!parsed.reply) {
      res.status(500).json({ error: "Empty response from model" });
      return;
    }
    parsed.mood = parsed.mood || "neutral";
    parsed.tone = parsed.tone || "informational";
    parsed.resources = Array.isArray(parsed.resources) 
      ? parsed.resources
          .slice(0, 3)
          .filter(r => r && (typeof r === "object"))
          .map(r => ({
            title: (r.title || r.url || "Resource").toString().trim(),
            url: (r.url || "#").toString().trim()
          }))
      : [];
    parsed.action = parsed.action || null;

    res.status(200).json(parsed);
  } catch (err) {
    console.error("API error:", err);
    const errorDetail = err?.message || err?.toString() || "Unknown error";
    console.error("Error stack:", err?.stack);
    res.status(500).json({ 
      error: "Server error", 
      detail: errorDetail 
    });
  }
}

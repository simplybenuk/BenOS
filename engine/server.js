const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 8787);
const OPENAI_URL = "https://api.openai.com/v1/audio/speech";
const MAX_TTS_CHARS = 4096;
const CHUNK_TARGET = 3800;

app.use(express.json({ limit: "2mb" }));

function parseAllowedOrigins() {
  const raw = (process.env.ALLOWED_ORIGINS || "").trim();
  if (!raw) return null;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const explicitOrigins = parseAllowedOrigins();

function allowOrigin(origin) {
  if (!origin || origin === "null") return true;
  if (explicitOrigins) return explicitOrigins.includes(origin);
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowOrigin(origin)) {
    if (origin && origin !== "null") {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function normalizeFormat(format) {
  return format === "wav" ? "wav" : "mp3";
}

function validateTtsInput(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be valid JSON.";
  }
  if (typeof body.text !== "string" || !body.text.trim()) {
    return "'text' is required and must be a non-empty string.";
  }
  if (body.format && body.format !== "mp3" && body.format !== "wav") {
    return "'format' must be either 'mp3' or 'wav'.";
  }
  return null;
}

function splitTextIntoChunks(text, maxLen = CHUNK_TARGET) {
  const chunks = [];
  let remaining = text.trim();

  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf("\n\n", maxLen);
    if (cut < Math.floor(maxLen * 0.5)) cut = remaining.lastIndexOf("\n", maxLen);
    if (cut < Math.floor(maxLen * 0.5)) cut = remaining.lastIndexOf(" ", maxLen);
    if (cut < Math.floor(maxLen * 0.5)) cut = maxLen;

    const part = remaining.slice(0, cut).trim();
    if (part) chunks.push(part);
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

async function openaiTts({ text, voice, format }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is not set on the Engine server.");
    err.status = 500;
    throw err;
  }

  const payload = {
    model: "gpt-4o-mini-tts",
    input: text,
    voice: voice || "alloy",
    format: normalizeFormat(format)
  };

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get("content-type") || `audio/${payload.format === "wav" ? "wav" : "mpeg"}`;

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`OpenAI request failed (${response.status}): ${errorText}`);
    err.status = 502;
    throw err;
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
    format: payload.format
  };
}

app.post("/openai/tts", async (req, res) => {
  const invalid = validateTtsInput(req.body);
  if (invalid) return res.status(400).json({ error: invalid });

  if (req.body.text.length > MAX_TTS_CHARS) {
    return res.status(400).json({
      error: `Text exceeds ${MAX_TTS_CHARS} chars. Use /openai/tts-chunked for long text.`
    });
  }

  try {
    const result = await openaiTts(req.body);
    res.setHeader("Content-Type", result.contentType);
    return res.status(200).send(result.buffer);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Unexpected Engine error" });
  }
});

app.post("/openai/tts-chunked", async (req, res) => {
  const invalid = validateTtsInput(req.body);
  if (invalid) return res.status(400).json({ error: invalid });

  const format = normalizeFormat(req.body.format);
  const chunks = splitTextIntoChunks(req.body.text, CHUNK_TARGET);

  try {
    const parts = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      if (chunk.length > MAX_TTS_CHARS) {
        return res.status(400).json({ error: `Chunk ${i + 1} exceeded max ${MAX_TTS_CHARS} characters.` });
      }
      const result = await openaiTts({
        text: chunk,
        voice: req.body.voice,
        format
      });
      parts.push({
        index: i,
        contentType: result.contentType,
        base64: result.buffer.toString("base64"),
        suggestedFilename: `tts-part-${String(i + 1).padStart(2, "0")}.${format}`
      });
    }

    return res.json({ parts });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || "Unexpected Engine error" });
  }
});

app.listen(PORT, () => {
  console.log(`BenOS Engine listening on http://localhost:${PORT}`);
});

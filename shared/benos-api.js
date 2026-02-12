const ENGINE_BASE = window.BENOS_ENGINE_BASE || "http://localhost:8787";

async function parseError(response) {
  let message = `Engine request failed (${response.status})`;
  try {
    const data = await response.json();
    if (data && data.error) message = data.error;
  } catch (_err) {
    const text = await response.text();
    if (text) message = text;
  }
  throw new Error(message);
}

export async function tts({ text, voice = "alloy", format = "mp3" }) {
  const response = await fetch(`${ENGINE_BASE}/openai/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, format })
  });

  if (!response.ok) await parseError(response);
  return response.blob();
}

export async function ttsChunked({ text, voice = "alloy", format = "mp3" }) {
  const response = await fetch(`${ENGINE_BASE}/openai/tts-chunked`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, format })
  });

  if (!response.ok) await parseError(response);
  const data = await response.json();

  return Promise.all((data.parts || []).map(async (part) => {
    const contentType = part.contentType || `audio/${format === "wav" ? "wav" : "mpeg"}`;
    const base64 = part.base64 || "";
    const res = await fetch(`data:${contentType};base64,${base64}`);
    const blob = await res.blob();

    return {
      blob,
      filename: part.suggestedFilename || `tts-part-${part.index}.${format}`,
      contentType: part.contentType || "application/octet-stream"
    };
  }));
}

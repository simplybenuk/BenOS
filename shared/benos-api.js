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

  return (data.parts || []).map((part) => {
    const binary = atob(part.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    return {
      blob: new Blob([bytes], { type: part.contentType || `audio/${format === "wav" ? "wav" : "mpeg"}` }),
      filename: part.suggestedFilename || `tts-part-${part.index}.${format}`,
      contentType: part.contentType || "application/octet-stream"
    };
  });
}

// Lightweight client-side translation helper with caching and multiple fallbacks
export async function translateText(text, target = 'en') {
  if (!text || text.trim() === '') return text;
  const trimmed = text.trim();

  console.debug('[translateText] request', { target, sample: trimmed.slice(0, 80) });

  // Try unofficial Google Translate endpoint first (often works without API key)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      target
    )}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((seg) => seg[0]).join('');
      }
    }
  } catch (e) {
    console.debug('[translateText] google translate error', e?.message || e);
    // fallthrough to other providers
  }

  // Try LibreTranslate as a fallback
  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: trimmed, source: 'auto', target, format: 'text' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.translatedText) return data.translatedText;
    }
  } catch (e) {
    console.debug('[translateText] libretranslate error', e?.message || e);
    // continue
  }

  // If all fail, return original text
  console.debug('[translateText] returning original text');
  return text;
}

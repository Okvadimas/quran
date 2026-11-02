/**
 * AI Translation Service using Google Gemini
 * Provides intelligent splitting and translation alignment for Quranic breath chunks.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const PREFERRED_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

/**
 * Get active Gemini API Key securely from environment variable.
 */
export function getGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Splits the official Indonesian translation into matching pieces for each Arabic chunk.
 * 
 * @param {Object} params
 * @param {string} params.fullArabic - The full Arabic verse text
 * @param {string} params.fullIndonesian - The full official Indonesian translation (Kemenag RI)
 * @param {Array<{id: string, arabicText: string}>} params.chunks - The array of chunks to translate
 * @returns {Promise<string[]>} Array of Indonesian translations corresponding to each chunk
 */
export async function splitVerseChunksWithAI({ fullArabic, fullIndonesian, chunks }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('API Key Gemini belum diatur di .env.local.');
  }

  if (!chunks || chunks.length === 0) {
    return [];
  }

  const promptText = `Kamu adalah pakar penerjemah Al-Qur'an bahasa Arab ke bahasa Indonesia berstandar Kementerian Agama Republik Indonesia (Kemenag RI).
Tugasmu adalah membagi terjemahan bahasa Indonesia resmi menjadi beberapa bagian sesuai potongan (chunk) teks Arab yang diberikan.

Berikut adalah ayat lengkapnya:
- Teks Arab Lengkap: "${fullArabic}"
- Terjemahan Resmi Kemenag: "${fullIndonesian}"

Daftar Potongan Ayat (Chunks) yang harus diterjemahkan:
${chunks.map((c, idx) => `Potongan ${idx + 1}: "${c.arabicText}"`).join('\n')}

ATURAN PENTING:
1. Pertahankan kosakata, nada, dan gaya terjemahan Kemenag di atas. Jangan membuat terjemahan yang keluar dari makna resmi tersebut.
2. Tiap potongan terjemahan harus akurat mencerminkan makna lafadz Arab pada potongan tersebut.
3. Format output WAJIB HANYA berupa array JSON valid berisi string terjemahan tanpa tanda kutip markdown pembungkus tambahan:
["terjemahan potongan 1", "terjemahan potongan 2", ...]`;

  // Helper to call Gemini with a specific model
  const callModel = async (model) => {
    const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.error?.message || `HTTP error ${response.status}`;
      throw new Error(`[Gemini ${model}] ${msg}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Tidak ada respon teks dari model Gemini.');
    }

    // Parse JSON
    const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed)) {
      throw new Error('Format respon Gemini bukan array JSON yang valid.');
    }
    return parsed;
  };

  try {
    return await callModel(PREFERRED_MODEL);
  } catch (err) {
    console.warn(`Gagal memanggil ${PREFERRED_MODEL}, mencoba fallback ke ${FALLBACK_MODEL}:`, err);
    return await callModel(FALLBACK_MODEL);
  }
}

/**
 * Translates a single specific chunk
 */
export async function translateSingleChunkWithAI({ fullArabic, fullIndonesian, chunkArabic, chunkIndex, totalChunks }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('API Key Gemini belum diatur di .env.local.');
  }

  const promptText = `Kamu adalah pakar penerjemah Al-Qur'an bahasa Arab ke bahasa Indonesia berstandar Kemenag RI.
Ayat Lengkap: "${fullArabic}"
Terjemahan Resmi Kemenag: "${fullIndonesian}"

Potongan Arab yang ingin diterjemahkan (bagian ke-${chunkIndex + 1} dari ${totalChunks}):
"${chunkArabic}"

Berikan HANYA terjemahan bahasa Indonesia untuk potongan Arab tersebut, selaras dengan makna resmi Kemenag.
Jawab singkat tanpa tambahan intro atau penjelasan:`;

  const response = await fetch(`${GEMINI_API_URL}/${PREFERRED_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return (text || '').trim();
}

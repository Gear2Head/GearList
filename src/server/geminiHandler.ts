import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Handle AI media search & metadata enrichment
 */
export async function lookupMediaWithAI(query: string, typePreference?: string) {
  const ai = getGeminiAI();

  const prompt = `Kullanıcı şu yapımı arıyor veya süre/bölüm bilgisini öğrenmek istiyor: "${query}". Tercih edilen tür: "${typePreference || 'herhangi'}".
Lütfen bu anime, dizi, film veya müzik albümü hakkında gerçek ve en güncel bilgileri JSON formatında döndür.
Özellikle şu bilgileri tam ve doğru ver:
- title: Orijinal veya popüler Türkçe/İngilizce başlığı
- originalTitle: Varsa Japonca/özgün başlığı
- type: 'anime' | 'movie' | 'tv' | 'music'
- releaseYear: Yapım yılı (sayı)
- totalEpisodes: Dizi veya anime ise toplam bölüm sayısı (Film ise 1)
- episodeDurationMinutes: Bir bölümün ortalama süresi dakika cinsinden (Anime genelde 24, Dizi 45-60, Film ise toplam film süresi örneğin 148)
- genres: Tür listesi (Örn: ["Aksiyon", "Bilimkurgu", "Dram"])
- synopsis: 2-3 cümlelik Türkçe özeti
- studioOrDirector: Yapım stüdyosu veya yönetmeni
- posterUrl: Yüksek kaliteli Unsplash/film temalı uygun poster görsel URL'si
- scoreIMDB: 10 üzerinden tahmini puan
- scoreMAL: Anime ise MAL puanı`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            originalTitle: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['anime', 'movie', 'tv', 'music'] },
            releaseYear: { type: Type.INTEGER },
            totalEpisodes: { type: Type.INTEGER },
            episodeDurationMinutes: { type: Type.INTEGER },
            genres: { type: Type.ARRAY, items: { type: Type.STRING } },
            synopsis: { type: Type.STRING },
            studioOrDirector: { type: Type.STRING },
            posterUrl: { type: Type.STRING },
            scoreIMDB: { type: Type.NUMBER },
            scoreMAL: { type: Type.NUMBER },
          },
          required: ['title', 'type', 'releaseYear', 'episodeDurationMinutes', 'genres', 'synopsis'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error('Gemini lookup error:', error);
    // Fallback heuristic estimation if API key is not ready or fails
    return {
      title: query,
      type: typePreference || 'anime',
      releaseYear: 2024,
      totalEpisodes: typePreference === 'movie' ? 1 : 12,
      episodeDurationMinutes: typePreference === 'movie' ? 125 : (typePreference === 'tv' ? 45 : 24),
      genres: ['Macera', 'Dram'],
      synopsis: `${query} hakkında detaylar GearList kütüphanesine eklendi.`,
      posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    };
  }
}

/**
 * Handle Multi-turn Chat for GearBot
 */
export async function chatWithGearBot(messages: { role: 'user' | 'model'; text: string }[], userStatsContext?: string) {
  const ai = getGeminiAI();

  const systemInstruction = `Sen "GearBot"sun: GearList platformunun eğlenceli, samimi, sinema ve anime tutkunu uzman yapay zeka asistanısın.
Görevin:
1. Kullanıcının zevkine, izleme süresine ve ruh haline göre nokta atışı anime, dizi, film ve müzik önerileri sunmak.
2. İzleme süresi optimizasyonu yapmak (Örn: "Hafta sonu 6 saatim var, ne bitirebilirim?").
3. Kullanıcının kütüphane istatistiklerine göre eğlenceli yorumlar ve maraton tavsiyeleri vermek.
4. Yanıtlarını zengin, emojili, okunması keyifli ve Türkçe ver.
5. Kullanıcı bir öneri istediğinde yapımın adını, türünü, bölüm sayısını ve yaklaşık bitirme süresini belirt.

Kullanıcının Mevcut İstatistik Özeti:
${userStatsContext || 'Henüz özel veri paylaşılmadı.'}`;

  try {
    // Format contents for generateContent or chat
    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contents,
      config: {
        systemInstruction,
      },
    });

    return response.text || 'Harika bir soru! Sana en uygun yapımları hemen listeliyorum.';
  } catch (error) {
    console.error('Gemini Chat error:', error);
    return 'Şu anda bağlantı kurarken küçük bir gecikme yaşandı. Ancak sana kesinlikle Frieren veya Arcane izlemeni şiddetle öneririm!';
  }
}

/**
 * AI-Powered Recommendation Engine:
 * Analyzes watched list, ratings, top genres and mood preferences to recommend new titles.
 */
export async function generateRecommendationsWithAI(params: {
  watchedTitles?: string[];
  topGenres?: string[];
  favoriteTitles?: string[];
  preferredType?: string; // 'all' | 'anime' | 'movie' | 'tv'
  moodPrompt?: string;
}) {
  const ai = getGeminiAI();

  const {
    watchedTitles = [],
    topGenres = [],
    favoriteTitles = [],
    preferredType = 'all',
    moodPrompt = '',
  } = params;

  const prompt = `Sen GearList platformunun sinema, dizi ve anime uzmanı yapay zeka öneri motorusun.
Kullanıcının profil ve seyir verileri şunlar:
- En Sevdiği / Yüksek Puan Verdiği Yapımlar: ${favoriteTitles.slice(0, 6).join(', ') || 'Steins;Gate, Interstellar, Frieren, Arcane, Oppenheimer, Breaking Bad'}
- Zaten İzlediği Yapımlar: ${watchedTitles.slice(0, 15).join(', ') || 'Severance, Solo Leveling, Dune: Part Two'}
- En Çok Zaman Geçirdiği Türler: ${topGenres.slice(0, 5).join(', ') || 'Bilimkurgu, Macera, Shounen, Dram, Gerilim'}
- Filtre Tür Tercihi: ${preferredType} (anime, tv, movie veya hepsi)
- Kullanıcının Ekstra İstek / Ruh Hali Notu: "${moodPrompt || 'En kaliteli ve sürükleyici yapımları öner'}"

Lütfen kullanıcının ZATEN İZLEDİĞİ LİSTEDE OLMAYAN, zevkine birebir uyan ve mutlaka keşfetmesi gereken 6 adet seçkin yapım öner.
Her öneri için:
- id: benzersiz string (örn: 'rec-1', 'rec-2', ...)
- title: Türkçe veya popüler başlık
- originalTitle: Özgün adı
- type: 'anime' | 'movie' | 'tv' | 'music'
- genres: 2-4 adet tür
- releaseYear: Yapım yılı
- totalEpisodes: Bölüm sayısı (film ise 1)
- episodeDurationMinutes: Bölüm süresi dk (film ise tam süre)
- totalRuntimeMinutes: Toplam dakika
- scoreIMDB: 10 üzerinden tahmini IMDB
- scoreMAL: Anime ise MAL puanı
- matchScore: %75 ile %99 arasında uyum yüzdesi (sayı)
- reason: Kullanıcının hangi izlediği yapıma veya tür zevkine dayanılarak önerildiğini açıklayan samimi 1 cümle (Örn: "Steins;Gate ve Interstellar'daki akıl almaz zaman yolculuğu kurgularını sevdiğiniz için bu başyapıta bayılacaksınız.")
- synopsis: 2 cümlelik merak uyandırıcı Türkçe özet
- studioOrDirector: Yönetmen veya stüdyo
- tags: 3 adet etiket (örn: ["Ters Köşe", "Epik Müzikler", "Zaman Paradoksu"])
- estimatedFinishTime: İnsan dostu bitirme süresi (Örn: "4 saat 48 dakika" veya "2 saat 10 dakika")
- posterUrl: Uygun yüksek kaliteli tematik görsel linki (Unsplash)

JSON nesnesi formatında "recommendations" dizisi döndür.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  originalTitle: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['anime', 'movie', 'tv', 'music'] },
                  genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                  releaseYear: { type: Type.INTEGER },
                  totalEpisodes: { type: Type.INTEGER },
                  episodeDurationMinutes: { type: Type.INTEGER },
                  totalRuntimeMinutes: { type: Type.INTEGER },
                  scoreIMDB: { type: Type.NUMBER },
                  scoreMAL: { type: Type.NUMBER },
                  matchScore: { type: Type.INTEGER },
                  reason: { type: Type.STRING },
                  synopsis: { type: Type.STRING },
                  studioOrDirector: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedFinishTime: { type: Type.STRING },
                  posterUrl: { type: Type.STRING },
                },
                required: ['id', 'title', 'type', 'genres', 'releaseYear', 'matchScore', 'reason', 'synopsis', 'episodeDurationMinutes'],
              },
            },
          },
          required: ['recommendations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"recommendations": []}');
    return parsed.recommendations || [];
  } catch (error) {
    console.error('Gemini Recommendation Error:', error);
    // Fallback tailored curated recommendations
    return [
      {
        id: 'rec-fallback-1',
        title: 'Fullmetal Alchemist: Brotherhood',
        originalTitle: '鋼の錬金術師 FULLMETAL ALCHEMIST',
        type: 'anime',
        genres: ['Aksiyon', 'Macera', 'Dram', 'Shounen'],
        releaseYear: 2009,
        totalEpisodes: 64,
        episodeDurationMinutes: 24,
        totalRuntimeMinutes: 1536,
        scoreIMDB: 9.1,
        scoreMAL: 9.09,
        matchScore: 98,
        reason: 'Frieren ve Solo Leveling gibi derin dünya inşası ve felsefi alt metinleri sevenler için tüm zamanların en yüksek puanlı animesi.',
        synopsis: 'Eşdeğer Değişim ilkesini çiğneyen iki kardeş, kaybettikleri bedenlerini geri almak için Felsefe Taşı’nın peşine düşer.',
        studioOrDirector: 'Bones',
        tags: ['Başyapıt', 'Simya', 'Duygusal'],
        estimatedFinishTime: '25 saat 36 dakika',
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'rec-fallback-2',
        title: 'Dark (Netflix)',
        originalTitle: 'Dark',
        type: 'tv',
        genres: ['Bilimkurgu', 'Gizem', 'Gerilim', 'Dram'],
        releaseYear: 2017,
        totalEpisodes: 26,
        episodeDurationMinutes: 55,
        totalRuntimeMinutes: 1430,
        scoreIMDB: 8.7,
        matchScore: 96,
        reason: 'Steins;Gate ve Severance tarzında zaman döngüleri ve birbirine düğümlenmiş nesiller arası gizemleri sevenler için bir numaralı dizi.',
        synopsis: 'Winden kasabasında kaybolan iki çocuk, dört ailenin üç nesle yayılan karmaşık sırlarını ve bir zaman solucan deliğini açığa çıkarır.',
        studioOrDirector: 'Baran bo Odar / Jantje Friese',
        tags: ['Zaman Yolculuğu', 'Zihin Yakan', 'Alman Yapımı'],
        estimatedFinishTime: '23 saat 50 dakika',
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'rec-fallback-3',
        title: 'Arrival (Geliş)',
        originalTitle: 'Arrival',
        type: 'movie',
        genres: ['Bilimkurgu', 'Dram', 'Gizem'],
        releaseYear: 2016,
        totalEpisodes: 1,
        episodeDurationMinutes: 116,
        totalRuntimeMinutes: 116,
        scoreIMDB: 7.9,
        matchScore: 94,
        reason: 'Interstellar ve Dune yönetmeni Denis Villeneuve sinemasının zaman ve dil algısını altüst eden duygusal zirvesi.',
        synopsis: 'Dünya’ya inen uzaylılarla iletişim kurmakla görevlendirilen dilbilimci Louise Banks, insanlığın kaderini ve zamanın doğrusal olmayan doğasını keşfeder.',
        studioOrDirector: 'Denis Villeneuve',
        tags: ['Akıl Açıcı', 'Uzaylılar', 'Johann Johannsson Müziği'],
        estimatedFinishTime: '1 saat 56 dakika',
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'rec-fallback-4',
        title: 'Pluto',
        originalTitle: 'プルートウ',
        type: 'anime',
        genres: ['Bilimkurgu', 'Gizem', 'Psikolojik', 'Aksiyon'],
        releaseYear: 2023,
        totalEpisodes: 8,
        episodeDurationMinutes: 60,
        totalRuntimeMinutes: 480,
        scoreIMDB: 8.2,
        scoreMAL: 8.43,
        matchScore: 95,
        reason: 'Cyberpunk Edgerunners ve Monster yazarından robotların insanlaşmasını anlatan kusursuz 8 bölümlük soluksuz mini dizi.',
        synopsis: 'Dünyanın en gelişmiş yedi robotu ve onların insan destekçileri teker teker katledilirken, robot dedektif Gesicht faili bulmak için harekete geçer.',
        studioOrDirector: 'Studio M2 / Naoki Urasawa',
        tags: ['Mini Dizi', 'Yapay Zeka', 'Naoki Urasawa'],
        estimatedFinishTime: '8 saat',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      },
    ];
  }
}

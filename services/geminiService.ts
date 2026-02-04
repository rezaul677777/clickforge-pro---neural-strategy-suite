import { GoogleGenAI, Type } from "@google/genai";
import { CTRConcept, AspectRatio, GenerationParams } from "../types";

/* -----------------------------
   Gemini Client
-------------------------------- */
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!
});

/* -----------------------------
   CTR CONCEPT BRAINSTORM
-------------------------------- */
export async function brainstormCTRConcepts(
  params: GenerationParams
): Promise<{ concepts: CTRConcept[]; trends?: any[] }> {

  const viralContext = params.isViralMode
    ? "MrBeast-style thumbnails: exaggerated emotion, extreme contrast, curiosity gap, bold colors."
    : "Professional, clean, business-focused high-conversion visuals.";

  const prompt = `
You are an elite YouTube CTR & thumbnail strategist.

Topic: "${params.topic}"
Audience: "${params.audience}"
Goal: "${params.goal}"
Style: "${params.style}"
Mode: ${viralContext}

Use Google Search trends internally.

Generate exactly 3 thumbnail concepts.
For each concept include:
- title
- description
- visualPrompt
- overlayText (max 4 words)
- overlayVariants (5)
- psychology
- colorPalette
- audienceSentiment [{ segment, reaction }]

Return ONLY valid JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-pro",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concepts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
                overlayText: { type: Type.STRING },
                overlayVariants: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                psychology: { type: Type.STRING },
                colorPalette: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                audienceSentiment: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      segment: { type: Type.STRING },
                      reaction: { type: Type.STRING }
                    }
                  }
                }
              },
              required: [
                "title",
                "description",
                "visualPrompt",
                "overlayText",
                "overlayVariants",
                "psychology",
                "colorPalette",
                "audienceSentiment"
              ]
            }
          }
        },
        required: ["concepts"]
      }
    }
  });

  const data = JSON.parse(response.text || '{"concepts":[]}');

  return {
    concepts: data.concepts.map((c: any, i: number) => ({
      ...c,
      id: `concept-${Date.now()}-${i}`
    })),
    trends: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
}

/* -----------------------------
   SEO ASSET GENERATION
-------------------------------- */
export async function generateSEOAssets(
  concept: CTRConcept,
  params: GenerationParams
) {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: `
Generate SEO assets for this video:

Thumbnail Title: "${concept.title}"
Topic: "${params.topic}"

Return JSON:
{
  "suggestedTitles": [],
  "tags": []
}
`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedTitles: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"suggestedTitles":[], "tags":[]}');
                  }

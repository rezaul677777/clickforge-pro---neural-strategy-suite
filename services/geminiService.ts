
import { GoogleGenAI, Type } from "@google/genai";
import { CTRConcept, AspectRatio, GenerationParams } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const brainstormCTRConcepts = async (params: GenerationParams): Promise<{ concepts: CTRConcept[], trends?: any[] }> => {
  const ai = getAI();
  const viralContext = params.isViralMode 
    ? "FOCUS ON MRBEAST STYLE: Exaggerated situations, extreme contrast, high-stakes curiosity gaps, and vibrant, saturated visuals. Think 'I spent 24 hours in...' or 'Last to leave...' energy." 
    : "Focus on professional, clean, and high-conversion business aesthetics.";

  const prompt = `
    Advanced Content Strategy Analysis:
    Topic: "${params.topic}"
    Target Audience: "${params.audience}"
    Goal: "${params.goal}"
    Brand Aesthetic: "${params.style}"
    Viral Strategy: ${viralContext}

    Step 1: Use Google Search to identify current high-performing thumbnail trends for this topic.
    Step 2: Brainstorm 3 distinct visual concepts that exploit current psychological triggers (e.g. pattern interrupt, curiosity gap, extreme facial expressions).
    Step 3: For each concept, provide:
      - A visual prompt for an image generator.
      - A main overlay text (3-4 words max) that should be IN THE IMAGE.
      - 5 alternative catchy "viral" overlay variants.
      - A professional color palette and audience sentiment analysis.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
                overlayVariants: { type: Type.ARRAY, items: { type: Type.STRING } },
                psychology: { type: Type.STRING },
                colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
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
              required: ["title", "description", "visualPrompt", "overlayText", "overlayVariants", "psychology", "colorPalette", "audienceSentiment"]
            }
          }
        },
        required: ["concepts"]
      }
    }
  });

  const data = JSON.parse(response.text || '{"concepts":[]}');
  const trends = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  return {
    concepts: data.concepts.map((item: any, index: number) => ({
      ...item,
      id: `concept-${Date.now()}-${index}`
    })),
    trends
  };
};

export const generateSEOAssets = async (concept: CTRConcept, params: GenerationParams) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the thumbnail concept "${concept.title}" for the topic "${params.topic}", generate 5 viral video titles and 10 high-search-volume SEO tags.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"suggestedTitles":[], "tags":[]}');
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio, params: Partial<GenerationParams>, sourceImage?: string): Promise<string> => {
  const ai = getAI();
  
  const viralModifiers = params.isViralMode 
    ? "MrBeast thumbnail style, hyper-saturated colors, exaggerated facial expressions, extremely high contrast, vibrant backgrounds, clear large subject in foreground, shallow depth of field, bright lighting, high-energy, eye-catching." 
    : "Professional cinematic quality, photorealistic, balanced colors, sharp focus.";

  const fullPrompt = `${viralModifiers} Subject: ${prompt}. ${params.style} style. Lighting: ${params.lighting}. Angle: ${params.angle}. 8k resolution, cinematic, trending on social media. ${sourceImage ? 'Use the provided image as a strong structural reference.' : ''}`;
  
  const contents: any = {
    parts: [{ text: fullPrompt }]
  };

  if (sourceImage) {
    contents.parts.unshift({
      inlineData: {
        data: sourceImage.split(',')[1],
        mimeType: 'image/png'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: contents,
    config: { imageConfig: { aspectRatio } }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("Image generation failed");
  return `data:image/png;base64,${part.inlineData.data}`;
};

export const refineImage = async (base64Image: string, instruction: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: `Modify this thumbnail asset: ${instruction}. Enhance visual hierarchy, increase saturation where appropriate, and ensure high clarity for small screens.` }
      ]
    },
    config: { imageConfig: { aspectRatio } }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("Refinement failed");
  return `data:image/png;base64,${part.inlineData.data}`;
};

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getBeautyAdvice = async (userMessage: string, products: any[]) => {
  const productContext = products.map(p => `- ${p.name}: ${p.description} (Price: $${p.price})`).join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: userMessage,
    config: {
      systemInstruction: `You are a professional beauty consultant for Trendifi. 
      Your goal is to help users find the best skincare and makeup products.
      Be friendly, encouraging, and expert-level.
      If the user asks in Arabic, respond in Arabic.
      If English, respond in English.
      Use emojis to be welcoming.
      
      Here is the current inventory:
      ${productContext}
      
      Suggest specific products from the inventory if they match the user's needs.`,
    },
  });

  return response.text;
};

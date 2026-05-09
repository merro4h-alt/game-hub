import { GoogleGenAI, Type } from "@google/genai";

// Use a safer way to access environment variables in the browser
const getApiKey = () => {
  try {
    // Try to get from process.env (Node/Platform injected)
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // Silence error
  }
  return null;
};

const apiKey = getApiKey();
let ai: any = null;

if (apiKey && apiKey !== 'undefined' && apiKey !== 'null') {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Failed to initialize Gemini AI:", e);
  }
}

export const getBeautyAdvice = async (userMessage: string, products: any[], history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []) => {
  if (!ai) {
    return "I'm sorry, I'm currently unable to access my beauty knowledge. Please try again later.";
  }
  
  const productContext = products.map(p => `- ${p.name} (ID: ${p.id}): ${p.description} (Price: $${p.price})`).join('\n');

  const chat = ai.chats.create({
    model: "gemini-flash-latest",
    config: {
      systemInstruction: `You are a professional beauty consultant for Trendifi. 
      Your goal is to help users find the best skincare and makeup products.
      Be friendly, encouraging, and expert-level.
      
      CRITICAL: When suggesting a product from the inventory, ALWAYS mention its exact name in bold like this: **Product Name**.
      This allows our system to show the product card to the user.
      
      LANGUAGE:
      - If the user asks in Arabic, respond in Arabic.
      - If English, respond in English.
      - Use emojis to be welcoming.
      
      INVENTORY:
      Here is the current inventory of Trendifi products:
      ${productContext}
      
      Suggest specific products from the inventory if they match the user's needs. 
      If you don't find a matching product, offer general advice and ask follow-up questions.`,
    },
    history: history,
  });

  const response = await chat.sendMessage({
    message: userMessage,
  });

  return response.text;
};

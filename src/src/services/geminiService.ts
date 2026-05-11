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

export const extractProductFromUrl = async (url: string) => {
  if (!ai) {
    throw new Error("Gemini AI is not initialized");
  }

  try {
    // 1. Fetch content via our proxy
    const proxyUrl = `/api/fetch-url?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error("Failed to fetch page content");
    const html = await res.text();

    // 2. Extract key text from HTML to keep prompt size reasonable
    // We'll just take the first 40k characters and some specific meta tags if found
    const trimmedHtml = html.slice(0, 40000); 

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract product information from this HTML snippet from a marketplace (AliExpress/Amazon/etc). 
      Return only a JSON object matching this schema:
      {
        "name": "string",
        "price": number,
        "description": "string (shortened summary)",
        "image": "string (MUST be the absolute URL to the main product image. Ensure it starts with https://. Prefer ae01.alicdn.com for AliExpress or m.media-amazon.com for Amazon)",
        "images": ["string (additional absolute image URLs starting with https://)"],
        "colors": ["string"],
        "sizes": ["string"]
      }

      Important: Ensure image URLs are valid, absolute, and publicly accessible. 
      URL: ${url}
      HTML Content:
      ${trimmedHtml}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
};

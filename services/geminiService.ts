
import { GoogleGenAI } from "@google/genai";

// Assume API_KEY is set in the environment.
// In a real app, this would be handled securely.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const summarizeAgreement = async (agreementText: string): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("AI functionality is disabled. Please configure your API key.");
  }

  try {
    const prompt = `Summarize the following legal publishing agreement in simple, easy-to-understand terms for a musician. Focus on their rights, responsibilities, and royalty splits. Keep it concise, using bullet points. Here is the agreement:\n\n---\n\n${agreementText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Could not summarize the agreement at this time. Please try again later.";
  }
};

function getCurrentLocation(): Promise<{latitude: number, longitude: number}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          reject(new Error("Unable to retrieve your location"));
        }
      );
    }
  });
}


export const getChatbotResponse = async (prompt: string): Promise<{ text: string; groundingChunks?: any[] }> => {
  if (!API_KEY) {
    return { text: "AI functionality is disabled. Please configure your API key." };
  }

  try {
    let toolConfig;
    try {
        const location = await getCurrentLocation();
        toolConfig = {
            retrievalConfig: {
                latLng: location,
            }
        };
    } catch (e) {
        console.warn("Could not get user location for grounding.", e);
        // proceed without location
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleMaps: {}}],
        toolConfig
      },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return { text, groundingChunks };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { text: "Could not get a response at this time. Please try again later." };
  }
};

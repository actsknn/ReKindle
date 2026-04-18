import { GoogleGenAI } from "@google/genai";

// Access your key from the .env file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || "";

// Initialize the client using the newer SDK configuration style
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeDonation(base64Image: string) {
  try {
    // We use the direct 'models' access pattern required by the @google/genai types
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Flash is fastest for a live hackathon demo
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
                Act as a sustainability and donation expert. I am providing an image of an item that could be anything from a kitchen appliance to clothing. Please analyze the image and provide a 'Disposition Recommendation' based on the following logic:

                1. Item Identification & Condition Report
                - Identify the item and its current state.
                - For Appliances: Look for cord integrity, rust, or missing parts.
                - For Clothing/Textiles: Look for pilling, stains, holes, or heavy fading.
                - For Furniture/Housewares: Look for structural cracks or surface damage.

                2. The 'Goodwill Test'
                - Determine if this is 'Sellable' or 'Unacceptable.'
                - Mention if this item belongs to a commonly restricted category (e.g., old car seats, halogen lamps, or hazardous electronics).

                3. The Specialized Recycling Path
                - If the item is rejected for donation, specify the best recycling route:
                - Textiles: Can it go to a 'secondary' textile recycler for rags?
                - E-Waste: Does it contain a circuit board or battery that requires a specialized facility?
                - Bulk/Metal: Is it high-value scrap?

                4. Preparation Step: Tell me one specific thing I should do before letting it go (e.g., 'sanitize the water reservoir' or 'remove personal labels').
                    
                Return ONLY a JSON object:
                {
                  "item": "string",
                  "decision": "Resell | Recycle",
                  "hazard": "string (if applicable, else write 'None')",
                  "reason": "string",
                  "category": "Clothing | Footwear | Accessories | Housewares | Linens & Domestics | Media & Entertainment | Electronics | Toys & Games | Sporting Goods | Furniture | Antiques & Collectibles | Other",
                  "estimatedValue": number (if resellable, else 0),
                  "tip": "string"
                }
              `
            },
            {
              inlineData: {
                data: base64Image,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    // In the new SDK, 'text' is a property, not a function call
    const text = response.text;
    
    // Clean up any potential markdown formatting
    const cleanJson = text?.replace(/```json|```/g, "").trim();
    
    if (!cleanJson) {
      throw new Error("No response text received from Gemini API");
    }
    
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Gemini Sustainability Error:", error);
    return {
      item: "Analysis Error",
      decision: "Recycle",
      hazard: "Unknown",
      reason: "The AI was unable to process this image. Please check your connection or API key.",
      category: "N/A",
      estimatedValue: 0,
      tip: "Ensure the item is well-lit and clearly visible."
    };
  }
}
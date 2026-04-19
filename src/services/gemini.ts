import { GoogleGenAI } from "@google/genai";

// Access your key from the .env file
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || "";

if (__DEV__) {
  const maskedKey = API_KEY 
    ? `****${API_KEY.slice(-4)}` 
    : "NOT FOUND (Double check your .env file)";
    
  console.log("------------------------------------");
  console.log("GEMINI API KEY STATUS:", maskedKey);
  console.log("------------------------------------");
}
// Initialize the client using the newer SDK configuration style
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeDonation(base64Image: string) {
  try {
    // We use the direct 'models' access pattern required by the @google/genai types
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Flash is fastest for a live hackathon demo
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
                Act as a sustainability and donation expert. I am providing an image of an item that could be anything from a kitchen appliance to clothing. Please analyze the image and provide a 'Disposition Recommendation' based on the following logic:

                1. AMBIGUITY & CLARITY RULE:
                - If the image is too blurry, the brand/quality is hidden, or you cannot determine if an appliance works based on visual cues, set "decision" to "AskClarification".
                - If you need a specific detail (e.g., "Is this 14k gold?", "Does the cord have fraying?", or "What is the brand name?"), use this state.

                2. Item Identification & Condition Report:
                - Identify the item and its current state.
                - For Appliances: Look for cord integrity, rust, or missing parts.
                - For Clothing/Textiles: Look for pilling, stains, holes, or heavy fading.
                - For Furniture/Housewares: Look for structural cracks or surface damage.

                3. The 'Goodwill Test':
                - Determine if this is 'Sellable' or 'Unacceptable.'
                - Mention if this item belongs to a commonly restricted category (e.g., old car seats, halogen lamps, or hazardous electronics).

                4. The Specialized Recycling Path:
                - If the item is rejected for donation, specify the best recycling route (Textile rags, E-Waste circuit boards, or Bulk Scrap Metal).

                5. Preparation Step: 
                - Provide one specific action the user should take (e.g., 'sanitize the water reservoir' or 'remove personal labels').

                Return ONLY a JSON object:
                {
                "item": "string",
                "decision": "Resell | Recycle | AskClarification",
                "hazard": "string (if applicable, else 'None')",
                "reason": "string (If AskClarification, put the specific question here)",
                "category": "Clothing | Footwear | Accessories | Housewares | Linens & Domestics | Media & Entertainment | Electronics | Toys & Games | Sporting Goods | Furniture | Antiques & Collectibles | Other",
                "estimatedValue": number (if resellable, else 0),
                "tip": "string",
                "needsFollowUp": boolean
                }
              `,
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
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    const isRateLimit = error.message?.includes('429');
    
    return {
      item: isRateLimit ? "System Refueling..." : "Analysis Error",
      decision: "Recycle",
      reason: isRateLimit 
        ? "We're receiving a high volume of scans. Please wait 5 seconds and try again!" 
        : "The AI couldn't see this clearly. Please check lighting.",
      category: "Other",
      estimatedValue: 0,
      tip: "Hackathon Tip: Try scanning one item at a time for the best accuracy."
    };
  }
}

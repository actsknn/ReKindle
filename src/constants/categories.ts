// src/constants/Categories.ts

export const DONATION_CATEGORIES = [
  "Clothing",
  "Footwear",
  "Accessories",
  "Housewares",
  "Linens & Domestics",
  "Media & Entertainment",
  "Electronics",
  "Toys & Games",
  "Sporting Goods",
  "Furniture",
  "Antiques & Collectibles",
  "Other"
];

/**
 * Helper to match Gemini's raw string output to your specific category list.
 * This is useful for your Supabase "location_demand" lookups later.
 */
export const getCategoryMatch = (aiOutput: string): string => {
  if (!aiOutput) return "Other";
  
  const matched = DONATION_CATEGORIES.find(cat => 
    aiOutput.toLowerCase().includes(cat.toLowerCase())
  );

  return matched || "Other";
};
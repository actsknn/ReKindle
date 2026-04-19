import { supabase } from "./supabase";

export interface SmartMatchResult {
  location_id: number;
  location_name: string;
  location_address: string;
  total_score: number;
}

/**
 * Sends an array of categories to the Supabase RPC 
 * and returns the best single location.
 */
export const getSmartMatch = async (categories: string[]): Promise<SmartMatchResult | null> => {
  if (!categories || categories.length === 0) return null;

  try {
    const { data, error } = await supabase.rpc('suggest_best_location', { 
      p_categories: categories 
    });

    if (error) throw error;

    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("Smart Match Service Error:", err);
    return null;
  }
};
/**
 * Calculates points and updates the user's profile in Supabase
 */
import { supabase } from '@/services/supabase';
export const processPointAward = async (userId: string, itemValue: number, isSmartMatch: boolean) => {
  // 1. Calculate points ($5 * 10 = 50 points)
  const basePoints = Math.round(itemValue * 10);
  
  // 2. Add 20% bonus if they followed the Smart Match
  const finalPoints = isSmartMatch ? Math.round(basePoints * 1.2) : basePoints;

  try {
    // 3. Update the Profile (Increment pending points)
    // We use an RPC or a simple update. 
    // This SQL snippet is better handled by a 'Function' to avoid race conditions:
    const { error: profileError } = await supabase.rpc('increment_pending_points', {
      user_id_input: userId,
      point_amount: finalPoints
    });

    if (profileError) throw profileError;

    return finalPoints;
  } catch (err) {
    console.error("Point Update Error:", err);
    return 0;
  }
};
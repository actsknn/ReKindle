import { getSmartMatch, SmartMatchResult } from "@/services/recommendations";
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  
  // State for the "Donation Bag" and the winning location
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [bestLocation, setBestLocation] = useState<SmartMatchResult | null>(null);

  // 1. Fetch the user's current "Pending" items to build the recommendation
  // In a real demo, this updates as soon as they finish a scan
  const refreshRecommendation = async () => {
    const { data } = await supabase
      .from('scans_history')
      .select('category')
      .eq('user_id', 'user-123')
      .eq('status', 'pending');

    if (data && data.length > 0) {
      const categories = data.map(item => item.category);
      setScannedItems(categories);
      
      // Call your new Smart Match Service
      const recommendation = await getSmartMatch(categories);
      setBestLocation(recommendation);
    }
  };

  useEffect(() => {
    refreshRecommendation();
  }, []);

  return (
    <View style={styles.container}>
      
      <View style={styles.dashboardCard}>
        <Text style={styles.greeting}>Welcome back, Shreyas!</Text>
        <Text style={styles.statsText}>You have 150 GoodCycle Points</Text>
      </View>

      {/* --- SMART RECOMMENDATION CARD --- */}
      {bestLocation && (
        <View style={styles.recommendationCard}>
          <View style={styles.recHeader}>
            <Ionicons name="sparkles" size={20} color="#FFD700" />
            <Text style={styles.recTitle}>SMART MATCH</Text>
          </View>
          <Text style={styles.recName}>{bestLocation.location_name}</Text>
          <Text style={styles.recAddress}>{bestLocation.location_address}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>+{bestLocation.total_score} Utility Points</Text>
          </View>
          <Text style={styles.recSubtext}>
            Best hub for your {scannedItems.length} items.
          </Text>
        </View>
      )}

      {/* The Big Scan Button */}
      <TouchableOpacity 
        style={styles.bigScanButton}
        onPress={() => router.push('/camera')}
        activeOpacity={0.8}
      >
        <View style={styles.buttonInner}>
          <Ionicons name="camera" size={50} color="#ffffff" />
          <Text style={styles.buttonText}>SCAN ITEM</Text>
        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  dashboardCard: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  // --- Recommendation Card Styles ---
  recommendationCard: {
    width: '90%',
    backgroundColor: '#1a1a1a', // Dark theme to match the map
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  recName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recAddress: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  scoreBadge: {
    backgroundColor: '#4CAF5022',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  scoreText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  // --- The Big Button Styles ---
  bigScanButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#4CAF50',
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 6,
    borderColor: '#E8F5E9',
  },
  buttonInner: {
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 8,
  }
});
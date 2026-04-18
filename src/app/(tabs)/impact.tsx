import { supabase } from '@/services/supabase'; // Fixes the 'supabase' error
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ImpactScreen() {
  const [points, setPoints] = useState({ pending: 0, approved: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const DUMMY_USER_ID = 'user-123';

  // This runs when the screen loads
  useEffect(() => {
    fetchImpactData();
  }, []);

  // Fixes the 'fetchImpactData' error
  const fetchImpactData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Point Balances
      const { data: profile } = await supabase
        .from('profiles')
        .select('pending_points, approved_points')
        .eq('user_id', DUMMY_USER_ID)
        .single();

      if (profile) {
        setPoints({ pending: profile.pending_points, approved: profile.approved_points });
      }

      // 2. Fetch History
      const { data: scans } = await supabase
        .from('scans_history')
        .select('*')
        .eq('user_id', DUMMY_USER_ID)
        .order('created_at', { ascending: false })
        .limit(10);

      if (scans) setRecentScans(scans);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // The logic for the "Drop-off" simulation
  const handleConfirmDropoff = async () => {
    if (points.pending === 0) {
      Alert.alert("No pending items", "Scan some items first!");
      return;
    }

    const { error } = await supabase.rpc('confirm_donation_dropoff', { 
      p_user_id: DUMMY_USER_ID 
    });

    // If the RPC above is too complex for now, we'll use this simpler manual update:
    const newApprovedTotal = points.approved + points.pending;
    
    await supabase.from('profiles').update({ 
      pending_points: 0, 
      approved_points: newApprovedTotal 
    }).eq('user_id', DUMMY_USER_ID);

    await supabase.from('scans_history').update({ 
      status: 'approved' 
    }).eq('user_id', DUMMY_USER_ID).eq('status', 'pending');

    Alert.alert("Success!", "Your points are now approved! 🍃");
    fetchImpactData();
  };

  if (loading) return <ActivityIndicator size="large" color="#4CAF50" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Impact</Text>
      </View>

      {/* Point Summary Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: '#EF6C00' }]}>{points.pending}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={[styles.statValue, { color: '#2E7D32' }]}>{points.approved}</Text>
        </View>
      </View>

      {/* Drop-off Button */}
      <TouchableOpacity style={styles.dropoffButton} onPress={handleConfirmDropoff}>
        <Ionicons name="location" size={20} color="white" />
        <Text style={styles.dropoffText}>Confirm Goodwill Drop-off</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentScans.map((scan: any) => (
        <View key={scan.id} style={styles.historyItem}>
          <View>
            <Text style={styles.itemName}>{scan.item_name}</Text>
            <Text style={styles.categoryText}>{scan.category}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.pointsAdd}>+{scan.points_awarded} pts</Text>
            <Text style={[styles.statusTag, { color: scan.status === 'approved' ? '#4CAF50' : '#FF9800' }]}>
              {scan.status.toUpperCase()}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 5 },
  statValue: { fontSize: 32, fontWeight: '800' },
  dropoffButton: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 30 },
  dropoffText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 15 },
  historyItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  itemName: { fontSize: 16, fontWeight: '600' },
  categoryText: { fontSize: 12, color: '#888' },
  pointsAdd: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  statusTag: { fontSize: 10, fontWeight: '800', marginTop: 4 }
});
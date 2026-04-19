import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ImpactScreen() {
  const [points, setPoints] = useState({ pending: 0, approved: 0 });
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const DUMMY_USER_ID = 'user-123';
  const POINT_TO_DOLLAR_RATIO = 10; // $1 = 10 points

  useEffect(() => {
    fetchImpactData();

    const subscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scans_history' },
        () => {
          console.log("🔥 New scan detected! Refreshing...");
          fetchImpactData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchImpactData = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pending_points, approved_points')
        .eq('user_id', DUMMY_USER_ID)
        .single();

      if (profile) {
        setPoints({ 
          pending: profile.pending_points ?? 0, 
          approved: profile.approved_points ?? 0 
        });
      }

      const { data: scans } = await supabase
        .from('scans_history')
        .select('*')
        .eq('user_id', DUMMY_USER_ID)
        .order('created_at', { ascending: false })
        .limit(10);

      if (scans) setRecentScans(scans);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDropoff = async () => {
    if (points.pending === 0) {
      Alert.alert("No pending items", "Scan some items first!");
      return;
    }

    try {
      const newApprovedTotal = (points.approved || 0) + (points.pending || 0);
      
      await supabase.from('profiles').update({ 
        pending_points: 0, 
        approved_points: newApprovedTotal 
      }).eq('user_id', DUMMY_USER_ID);

      await supabase.from('scans_history').update({ 
        status: 'approved' 
      }).eq('user_id', DUMMY_USER_ID).eq('status', 'pending');

      Alert.alert("Success!", `You just unlocked $${(points.pending / POINT_TO_DOLLAR_RATIO).toFixed(2)} in credit! 🍃`);
      fetchImpactData();
    } catch (err) {
      console.error("Update Error:", err);
    }
  };

  // Math for the UI
  const approvedValue = (points.approved / POINT_TO_DOLLAR_RATIO).toFixed(2);
  const pendingValue = (points.pending / POINT_TO_DOLLAR_RATIO).toFixed(2);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4CAF50" animating={true} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Impact</Text>
      </View>

      {/* --- NEW CASH VALUE CARD --- */}
      <View style={styles.creditCard}>
        <View>
          <Text style={styles.creditLabel}>STORE CREDIT</Text>
          <Text style={styles.creditValue}>${approvedValue}</Text>
        </View>
        <Ionicons name="wallet" size={40} color="#4CAF50" />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: '#EF6C00' }]}>{points.pending}</Text>
          <Text style={styles.valueEstimate}>Est. ${pendingValue}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statLabel}>Approved</Text>
          <Text style={[styles.statValue, { color: '#2E7D32' }]}>{points.approved}</Text>
          <Text style={styles.valueEstimate}>Earned</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.dropoffButton} onPress={handleConfirmDropoff} activeOpacity={0.7}>
        <Ionicons name="location" size={20} color="white" />
        <Text style={styles.dropoffText}>Confirm Goodwill Drop-off</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      {recentScans && recentScans.length > 0 ? (
        recentScans.map((scan) => (
          <View key={scan.id?.toString()} style={styles.historyItem}>
            <View>
              <Text style={styles.itemName}>{scan.item_name || 'Unknown Item'}</Text>
              <Text style={styles.categoryText}>{scan.category || 'Other'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.pointsAdd}>+{scan.points_awarded || 0} pts</Text>
              <Text style={[
                styles.statusTag, 
                { color: scan.status === 'approved' ? '#4CAF50' : '#FF9800' }
              ]}>
                {(scan.status || 'pending').toUpperCase()}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No scans yet. Start recycling!</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  
  // New Styles for Credit Card
  creditCard: { 
    backgroundColor: 'white', 
    padding: 25, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  creditLabel: { fontSize: 12, fontWeight: '800', color: '#888', letterSpacing: 1 },
  creditValue: { fontSize: 36, fontWeight: '900', color: '#1a1a1a' },
  valueEstimate: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 5 },
  statValue: { fontSize: 28, fontWeight: '800' },
  
  dropoffButton: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 30 },
  dropoffText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 15 },
  historyItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 1 },
  itemName: { fontSize: 16, fontWeight: '600' },
  categoryText: { fontSize: 12, color: '#888' },
  pointsAdd: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  statusTag: { fontSize: 10, fontWeight: '800', marginTop: 4 }
});
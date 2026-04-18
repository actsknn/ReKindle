import { supabase } from '@/services/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { analyzeDonation } from '../services/gemini';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  uiOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40 },
  scanInstruction: { color: '#fff', fontSize: 18, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20 },
  buttonContainer: { marginBottom: 30 },
  captureButton: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  innerCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  counterBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  resultOverlay: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  resultCard: { backgroundColor: '#fff', padding: 30, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 10, color: '#1a1a1a' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 15 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  bodyText: { fontSize: 16, color: '#444', lineHeight: 22, marginBottom: 15 },
  valueText: { fontSize: 20, fontWeight: 'bold', color: '#2E7D32', marginBottom: 10 },
  tipText: { fontSize: 14, color: '#666', fontStyle: 'italic', marginBottom: 25 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resultContainer: { flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center' },
  processButton: { backgroundColor: '#4CAF50', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  confirmButton: { backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  overrideButton: { backgroundColor: '#FF9800', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
  cancelButton: { backgroundColor: '#efefef', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }
});

export default function GoodCycleScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); 
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);
  const [photoBatch, setPhotoBatch] = useState<string[]>([]);

  const DUMMY_USER_ID = 'user-123';

  // Helper function to update the user's specific point buckets in Supabase
  const updateProfileStats = async (pointsToAdd: number) => {
    // 1. Get current values
    const { data } = await supabase
      .from('profiles')
      .select('pending_points, total_items_scanned')
      .eq('user_id', DUMMY_USER_ID)
      .single();
    
    const currentPending = data?.pending_points || 0;
    const currentTotalItems = data?.total_items_scanned || 0;

    // 2. Update with incremented values
    await supabase
      .from('profiles')
      .update({ 
        pending_points: currentPending + pointsToAdd,
        total_items_scanned: currentTotalItems + 1
      })
      .eq('user_id', DUMMY_USER_ID);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const points = result.estimatedValue || 0;

      // Matches your scans_history table columns
      await supabase.from('scans_history').insert({
        user_id: DUMMY_USER_ID,
        item_name: result.item,
        category: result.category,
        final_decision: result.decision,
        points_awarded: points,
        was_overridden: false,
        status: 'pending' // Initial status
      });

      await updateProfileStats(points);

      setResult(null);
      setPhotoBatch([]);
      router.replace('/impact');
    } catch (e) {
      console.error("Error saving to Supabase:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleOverride = async () => {
    setSaving(true);
    try {
      const overriddenDecision = result.decision === 'Recycle' ? 'Resell' : 'Recycle';
      const points = (result.estimatedValue || 0) + 5; 

      await supabase.from('scans_history').insert({
        user_id: DUMMY_USER_ID,
        item_name: result.item,
        category: result.category,
        final_decision: overriddenDecision,
        points_awarded: points,
        was_overridden: true,
        status: 'pending'
      });

      await updateProfileStats(points);

      setResult(null);
      setPhotoBatch([]);
      router.replace('/impact');
    } catch (e) {
      console.error("Error saving override to Supabase:", e);
    } finally {
      setSaving(false);
    }
  };

  async function handleAddPhoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ 
        base64: true, 
        quality: 0.3
      });
      setPhotoBatch(prev => [...prev, photo.base64!]);
    }
  }

  async function handleProcessBatch() {
    if (photoBatch.length === 0) return;
    
    setLoading(true);
    try {
      const results = await Promise.all(
        photoBatch.map(photo => analyzeDonation(photo))
      );
      setResult(results[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.title}>Camera Access Needed</Text>
          <Text style={styles.bodyText}>We use the camera to help you sort your donations for Goodwill.</Text>
          <TouchableOpacity style={{backgroundColor: '#0055ff', padding: 16, borderRadius: 14}} onPress={requestPermission}>
            <Text style={styles.buttonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {result ? (
        <SafeAreaView style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <Text style={styles.title}>{result.item}</Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 10, fontWeight: '600' }}>
              📂 CATEGORY: {result.category}
            </Text>

            <View style={[styles.badge, { backgroundColor: result.decision === 'Resell' ? '#4CAF50' : '#FF9800' }]}>
              <Text style={styles.badgeText}>{result.decision.toUpperCase()}</Text>
            </View>

            <Text style={styles.bodyText}>{result.reason}</Text>
            
            {result.estimatedValue > 0 && (
              <View style={{ backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, marginBottom: 15 }}>
                <Text style={styles.valueText}>Est. Resale Value: ${result.estimatedValue}</Text>
              </View>
            )}

            <Text style={styles.tipText}>💡 Prep Step: {result.tip}</Text>

            {saving ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              <View>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.buttonText}>Confirm & Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.overrideButton} onPress={handleOverride}>
                  <Text style={styles.buttonText}>
                    Override: Actually {result.decision === 'Recycle' ? 'Resell' : 'Recycle'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setResult(null);
                  setPhotoBatch([]);
                }}>
                  <Text style={[styles.buttonText, { color: '#666', fontSize: 16 }]}>Cancel / Rescan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef}>
          <SafeAreaView style={styles.uiOverlay}>
            <View style={styles.counterBadge}>
              <Text style={styles.scanInstruction}>
                {photoBatch.length === 0 ? "Point & Scan" : `${photoBatch.length} Photos Captured`}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : (
                <View style={styles.controlsRow}>
                  <TouchableOpacity style={styles.captureButton} onPress={handleAddPhoto}>
                    <View style={styles.innerCircle} />
                  </TouchableOpacity>

                  {photoBatch.length > 0 && (
                    <TouchableOpacity style={styles.processButton} onPress={handleProcessBatch}>
                      <Text style={styles.buttonText}>Finish</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </SafeAreaView>
        </CameraView>
      )}
    </View>
  );
}
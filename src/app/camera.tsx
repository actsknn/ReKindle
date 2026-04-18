import { CameraView, useCameraPermissions } from 'expo-camera';
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
  button: { backgroundColor: '#0055ff', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resultContainer: { flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center' },
  processButton: { backgroundColor: '#4CAF50', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' }
});

export default function GoodCycleScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);
  const [photoBatch, setPhotoBatch] = useState<string[]>([]);


  // This just adds a photo to the "pile"
  async function handleAddPhoto() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ 
        base64: true, 
        quality: 0.3 // Dropped quality slightly to handle multiple photos faster
      });
      setPhotoBatch(prev => [...prev, photo.base64]);
    }
  }

  // This sends the whole pile to Gemini
  async function handleProcessBatch() {
    if (photoBatch.length === 0) return;
    
    setLoading(true);
    try {
      // Process all photos in the batch
      const results = await Promise.all(
        photoBatch.map(photo => analyzeDonation(photo))
      );
      // Show the first result (or aggregate if needed)
      setResult(results[0]);
      setPhotoBatch([]); // Reset for next time
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
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleScan() {
    if (cameraRef.current) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ 
          base64: true, 
          quality: 0.5 // Lower quality for faster AI upload
        });
        const aiResponse = await analyzeDonation(photo.base64);
        setResult(aiResponse);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
  <View style={styles.container}>
    {result ? (
      <SafeAreaView style={styles.resultOverlay}>
        <View style={styles.resultCard}>
          {/* 1. Item Name and Category */}
          <Text style={styles.title}>{result.item}</Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 10, fontWeight: '600' }}>
            📂 CATEGORY: {result.category}
          </Text>

          {/* 2. Decision Badge */}
          <View style={[styles.badge, { backgroundColor: result.decision === 'Resell' ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.badgeText}>{result.decision.toUpperCase()}</Text>
          </View>

          {/* 3. NEW: Hazard Warning - Only shows if there's a hazard */}
          {result.hazard !== "None" && (
            <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 10, borderLeftWidth: 5, borderLeftColor: '#FF9800', marginBottom: 15 }}>
              <Text style={{ color: '#E65100', fontWeight: 'bold' }}>⚠️ HAZARD DETECTED:</Text>
              <Text style={{ color: '#E65100' }}>{result.hazard}</Text>
            </View>
          )}

          {/* 4. The Reason and Value */}
          <Text style={styles.bodyText}>{result.reason}</Text>
          
          {result.estimatedValue > 0 && (
            <View style={{ backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8, marginBottom: 15 }}>
              <Text style={styles.valueText}>Est. Resale Value: ${result.estimatedValue}</Text>
            </View>
          )}

          {/* 5. The Prep Tip */}
          <Text style={styles.tipText}>💡 Prep Step: {result.tip}</Text>

          {/* 6. Reset Button */}
          <TouchableOpacity style={styles.button} onPress={() => setResult(null)}>
            <Text style={styles.buttonText}>Scan Next Item</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    ) : (
      <CameraView style={styles.camera} ref={cameraRef}>
        <SafeAreaView style={styles.uiOverlay}>
          {/* 1. The Counter Badge at the top */}
          <View style={styles.counterBadge}>
            <Text style={styles.scanInstruction}>
              {photoBatch.length === 0 ? "Point & Scan" : `${photoBatch.length} Photos Captured`}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              /* 2. The Horizontal Layout for the two buttons */
              <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.captureButton} onPress={handleAddPhoto}>
                  <View style={styles.innerCircle} />
                </TouchableOpacity>

                {/* Only show Finish button if there is at least one photo */}
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

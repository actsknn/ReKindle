import { analyzeDonation } from "@/services/gemini";
import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DUMMY_USER_ID = "user-123";

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#5bc4f5" />
        <Text style={styles.permissionTitle}>Camera permission needed</Text>
        <Text style={styles.permissionText}>
          ReKindle uses your camera to scan donation items.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const shot = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });
      if (!shot) return;
      setPhoto(shot.uri);
      setAnalyzing(true);

      const analysis = await analyzeDonation(shot.base64!);
      setResult(analysis);

      if (analysis) {
        await supabase.from("scans_history").insert({
          user_id: DUMMY_USER_ID,
          category: analysis.category || "Other",
          item_name: analysis.item_name || "Unknown item",
          estimated_value: analysis.estimated_value || 0,
          credits: analysis.credits || 0,
          status: "pending",
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Couldn't process the photo. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
    setResult(null);
  };

  const confirm = () => {
    Alert.alert(
      "Added to your bag",
      "We'll route it to the right ReKindle location.",
    );
    router.back();
  };

  // Result view
  if (photo && result && !analyzing) {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <TouchableOpacity style={styles.backButton} onPress={retake}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>WE SPOTTED</Text>
          <Text style={styles.resultName}>
            {result.item_name || "Unknown item"}
          </Text>
          <Text style={styles.resultCategory}>
            {result.category || "Other"}
          </Text>
          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatLabel}>EST. VALUE</Text>
              <Text style={styles.resultStatValue}>
                ${result.estimated_value || 0}
              </Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatLabel}>CREDITS</Text>
              <Text style={styles.resultStatValue}>+{result.credits || 0}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
            <Text style={styles.confirmText}>Add to my bag</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={retake} style={styles.retakeBtn}>
            <Text style={styles.retakeText}>Scan another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Analyzing state
  if (analyzing) {
    return (
      <View style={styles.container}>
        {photo && <Image source={{ uri: photo }} style={styles.fullPreview} />}
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#5bc4f5" />
          <Text style={styles.analyzingText}>Analyzing your item...</Text>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

<<<<<<< HEAD
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacing(facing === "back" ? "front" : "back")}
        >
          <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.bottomBar}>
          <Text style={styles.hint}>Point at an item to donate</Text>
          <TouchableOpacity style={styles.shutter} onPress={takePicture}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
=======
                {saving ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : (
                  <View>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                      <Text style={styles.buttonText}>Confirm & Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.overrideButton} onPress={handleOverride}>
                      <Text style={styles.buttonText}>Override: Actually {result.decision === 'Recycle' ? 'Resell' : 'Recycle'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => { setResult(null); setPhotoBatch([]); }}>
                      <Text style={[styles.buttonText, { color: '#666', fontSize: 16 }]}>Cancel / Rescan</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      ) : (
        <CameraView style={styles.camera} ref={cameraRef}>
          <SafeAreaView style={styles.uiOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.counterBadge}>
              <Text style={styles.scanInstruction}>{photoBatch.length === 0 ? "Point & Scan" : `${photoBatch.length} Photos Captured`}</Text>
            </View>
            <View style={styles.buttonContainer}>
              {loading ? <ActivityIndicator size="large" color="#ffffff" /> : (
                <View style={styles.controlsRow}>
                  <TouchableOpacity style={styles.captureButton} onPress={handleAddPhoto}><View style={styles.innerCircle} /></TouchableOpacity>
                  {photoBatch.length > 0 && <TouchableOpacity style={styles.processButton} onPress={handleProcessBatch}><Text style={styles.buttonText}>Finish</Text></TouchableOpacity>}
                </View>
              )}
            </View>
          </SafeAreaView>
        </CameraView>
      )}
>>>>>>> 06339609a30da081adc4824d9dee80901868a28c
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
<<<<<<< HEAD
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  flipButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 20,
  },
  hint: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.85,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  fullPreview: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
  analyzingText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resultContainer: { flex: 1, backgroundColor: "#0a0a0a" },
  preview: { width: "100%", height: "45%" },
  resultCard: { flex: 1, backgroundColor: "#0a0a0a", padding: 24, gap: 8 },
  resultLabel: {
    color: "#5bc4f5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  resultName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  resultCategory: { color: "#888", fontSize: 15, marginBottom: 12 },
  resultStats: { flexDirection: "row", gap: 12, marginBottom: 20 },
  resultStat: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
=======
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
  cancelButton: { backgroundColor: '#efefef', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  // ADDED INPUT STYLE
  input: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
>>>>>>> 06339609a30da081adc4824d9dee80901868a28c
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  resultStatLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  resultStatValue: {
    color: "#5bc4f5",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: -1,
  },
  confirmBtn: {
    backgroundColor: "#5bc4f5",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  confirmText: { color: "#0a0a0a", fontSize: 16, fontWeight: "800" },
  retakeBtn: { paddingVertical: 12, alignItems: "center" },
  retakeText: { color: "#888", fontSize: 14, fontWeight: "600" },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 14,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 12,
  },
  permissionText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: "#5bc4f5",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  permissionBtnText: { color: "#0a0a0a", fontWeight: "800", fontSize: 15 },
  cancelBtn: { marginTop: 8, padding: 12 },
  cancelText: { color: "#888", fontSize: 14 },
});

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
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

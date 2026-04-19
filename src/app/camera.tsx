import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { analyzeDonation } from "../services/gemini";

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: "laptop-outline",
  "Clothing & Accessories": "shirt-outline",
  Furniture: "bed-outline",
  "Books & Media": "book-outline",
  Kitchenware: "restaurant-outline",
  "Toys & Games": "game-controller-outline",
  "Home Decor": "home-outline",
  "Tools & Hardware": "hammer-outline",
  "Sports & Outdoors": "bicycle-outline",
  "Baby & Kids": "happy-outline",
};

export default function GoodCycleScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);
  
  // New States for Batching
  const [photoBatch, setPhotoBatch] = useState<string[]>([]);
  const [sessionItems, setSessionItems] = useState<any[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  
  const [clarificationText, setClarificationText] = useState("");
  const [facing, setFacing] = useState<"front" | "back">("back");

  const DUMMY_USER_ID = "user-123";

  const updateProfileStats = async (pointsToAdd: number) => {
    const { data } = await supabase
      .from("profiles")
      .select("pending_points, total_items_scanned")
      .eq("user_id", DUMMY_USER_ID)
      .single();
    const currentPending = data?.pending_points || 0;
    const currentTotalItems = data?.total_items_scanned || 0;
    await supabase
      .from("profiles")
      .update({
        pending_points: currentPending + pointsToAdd,
        total_items_scanned: currentTotalItems + 1,
      })
      .eq("user_id", DUMMY_USER_ID);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const points = result.estimatedValue || 0;
      await supabase.from("scans_history").insert({
        user_id: DUMMY_USER_ID,
        item_name: result.item,
        category: result.category,
        final_decision: result.decision,
        points_awarded: points,
        was_overridden: false,
        status: "pending",
      });
      await updateProfileStats(points);
      
      // Save locally to show in the summary
      setSessionItems((prev) => [...prev, result]);
      
      // Reset the camera for the NEXT item instead of routing away
      setResult(null);
      setPhotoBatch([]);
    } catch (e) {
      console.error("Error saving:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleOverride = async () => {
    setSaving(true);
    try {
      const overriddenDecision = result.decision === "Recycle" ? "Resell" : "Recycle";
      const points = (result.estimatedValue || 0) + 5;
      await supabase.from("scans_history").insert({
        user_id: DUMMY_USER_ID,
        item_name: result.item,
        category: result.category,
        final_decision: overriddenDecision,
        points_awarded: points,
        was_overridden: true,
        status: "pending",
      });
      await updateProfileStats(points);
      
      const newResult = { ...result, decision: overriddenDecision };
      setSessionItems((prev) => [...prev, newResult]);
      
      setResult(null);
      setPhotoBatch([]);
    } catch (e) {
      console.error("Error saving override:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleClarifySubmit = async () => {
    setLoading(true);
    try {
      const forcedResult = {
        ...result,
        decision: "Resell",
        reason: `User clarified: ${clarificationText}. Verified as sellable quality.`,
        estimatedValue: result.estimatedValue || 10,
        tip: "Great job clarifying! This item is ready for Goodwill.",
      };
      setResult(forcedResult);
      setClarificationText("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  async function handleAddPhoto() {
    if (cameraRef.current && !loading) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.1,
      });
      setPhotoBatch((prev) => [...prev, photo.base64!]);
    }
  }

  async function handleProcessBatch() {
    if (photoBatch.length === 0) return;
    setLoading(true);
    try {
      const lastPhoto = photoBatch[photoBatch.length - 1];
      const resultData = await analyzeDonation(lastPhoto);
      setResult(resultData);
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
          <TouchableOpacity
            style={{ backgroundColor: "#0055ff", padding: 16, borderRadius: 14 }}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- VIEW 3: The Summary Batch List ---
  if (showSummary) {
    return (
      <SafeAreaView style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Your Donation Bag</Text>
          <Text style={styles.summarySubtext}>{sessionItems.length} items scanned</Text>
        </View>

        <ScrollView style={styles.summaryList}>
          {sessionItems.map((item, idx) => (
            <View key={idx} style={styles.summaryListItem}>
              <View style={styles.summaryIconWrapper}>
                <Ionicons name={(CATEGORY_ICONS[item.category] || "cube-outline") as any} size={24} color="#5bc4f5" />
              </View>
              <View style={styles.summaryItemDetails}>
                <Text style={styles.summaryItemName}>{item.item}</Text>
                <Text style={styles.summaryItemCategory}>{item.category}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: item.decision === "Resell" ? "#4CAF50" : "#FF9800", marginBottom: 0 }]}>
                <Text style={styles.badgeText}>{item.decision.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.summaryFooter}>
          <TouchableOpacity 
            style={styles.processButton} 
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.buttonText}>Find Best Drop-Off Location</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cancelButton, { marginTop: 10 }]} 
            onPress={() => setShowSummary(false)}
          >
            <Text style={[styles.buttonText, { color: "#666" }]}>Back to Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- VIEW 2: AI Result Confirmation --- */}
      {result ? (
        <SafeAreaView style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            {result.decision === "AskClarification" ? (
              <View>
                <Text style={styles.title}>Need More Info</Text>
                <Text style={styles.bodyText}>{result.reason}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type your answer here..."
                  placeholderTextColor="#999"
                  value={clarificationText}
                  onChangeText={setClarificationText}
                />
                <TouchableOpacity style={styles.confirmButton} onPress={handleClarifySubmit}>
                  <Text style={styles.buttonText}>Submit Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => { setResult(null); setPhotoBatch([]); }}>
                  <Text style={[styles.buttonText, { color: "#666" }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.categoryIconWrapper}>
                  <Ionicons name={(CATEGORY_ICONS[result.category] || "cube-outline") as any} size={28} color="#5bc4f5" />
                </View>
                <Text style={styles.title}>{result.item}</Text>
                <Text style={styles.categoryLabel}>📂 {result.category}</Text>

                <View style={[styles.badge, { backgroundColor: result.decision === "Resell" ? "#4CAF50" : "#FF9800" }]}>
                  <Text style={styles.badgeText}>{result.decision.toUpperCase()}</Text>
                </View>

                <Text style={styles.bodyText}>{result.reason}</Text>

                {result.estimatedValue > 0 && (
                  <View style={styles.valueBox}>
                    <Text style={styles.valueText}>Est. Resale Value: ${result.estimatedValue}</Text>
                  </View>
                )}

                <Text style={styles.tipText}>💡 {result.tip}</Text>

                {saving ? (
                  <ActivityIndicator size="large" color="#4CAF50" />
                ) : (
                  <View>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                      <Text style={styles.buttonText}>Add to Bag & Keep Scanning</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.overrideButton} onPress={handleOverride}>
                      <Text style={styles.buttonText}>Override: Actually {result.decision === "Recycle" ? "Resell" : "Recycle"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => { setResult(null); setPhotoBatch([]); }}>
                      <Text style={[styles.buttonText, { color: "#666", fontSize: 16 }]}>Cancel / Rescan</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      ) : (
        /* --- VIEW 1: Active Camera --- */
        <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
          <SafeAreaView style={styles.uiOverlay}>
            <View style={styles.topRow}>
              <TouchableOpacity style={styles.circleButton} onPress={() => router.replace("/(tabs)")}>
                <Ionicons name="home" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}>
                <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

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
                  {/* New Review Batch Button appears when items are saved */}
                  {sessionItems.length > 0 && (
                    <TouchableOpacity style={styles.reviewButton} onPress={() => setShowSummary(true)}>
                      <Ionicons name="briefcase" size={22} color="#fff" />
                      <Text style={styles.reviewButtonText}>{sessionItems.length}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.captureButton} onPress={handleAddPhoto}>
                    <View style={styles.innerCircle} />
                  </TouchableOpacity>

                  {photoBatch.length > 0 && (
                    <TouchableOpacity style={styles.processButtonSmall} onPress={handleProcessBatch}>
                      <Text style={styles.buttonText}>Check</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  uiOverlay: { flex: 1, justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
  topRow: { width: "100%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10 },
  circleButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  scanInstruction: { color: "#fff", fontSize: 18, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.5)", padding: 10, borderRadius: 20 },
  buttonContainer: { marginBottom: 30, width: "100%", alignItems: "center" },
  captureButton: { width: 84, height: 84, borderRadius: 42, borderWidth: 4, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  innerCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff" },
  counterBadge: { backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  controlsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", paddingHorizontal: 30, gap: 15 },
  
  // New buttons next to camera trigger
  reviewButton: { backgroundColor: "#FF9800", flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, gap: 6 },
  reviewButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  processButtonSmall: { backgroundColor: "#4CAF50", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: "center" },
  
  resultOverlay: { flex: 1, backgroundColor: "#f5f5f5", justifyContent: "center", padding: 20 },
  resultCard: { backgroundColor: "#fff", padding: 30, borderRadius: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  categoryIconWrapper: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#0d1f2d", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6, color: "#1a1a1a" },
  categoryLabel: { fontSize: 13, color: "#888", fontWeight: "600", marginBottom: 12 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 15 },
  badgeText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  bodyText: { fontSize: 16, color: "#444", lineHeight: 22, marginBottom: 15 },
  valueBox: { backgroundColor: "#E8F5E9", padding: 10, borderRadius: 8, marginBottom: 15 },
  valueText: { fontSize: 20, fontWeight: "bold", color: "#2E7D32" },
  tipText: { fontSize: 14, color: "#666", fontStyle: "italic", marginBottom: 25 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  resultContainer: { flex: 1, padding: 40, justifyContent: "center", alignItems: "center" },
  processButton: { backgroundColor: "#4CAF50", paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, alignItems: "center", width: "100%" },
  confirmButton: { backgroundColor: "#4CAF50", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 10 },
  overrideButton: { backgroundColor: "#FF9800", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 10 },
  cancelButton: { backgroundColor: "#efefef", paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  input: { backgroundColor: "#f0f0f0", padding: 15, borderRadius: 12, fontSize: 16, color: "#333", marginBottom: 20, borderWidth: 1, borderColor: "#ddd" },
  
  // Summary View Styles
  summaryContainer: { flex: 1, backgroundColor: "#f5f5f5" },
  summaryHeader: { padding: 24, paddingTop: 40, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  summaryTitle: { fontSize: 28, fontWeight: "800", color: "#1a1a1a" },
  summarySubtext: { fontSize: 16, color: "#666", marginTop: 4 },
  summaryList: { flex: 1, padding: 20 },
  summaryListItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  summaryIconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#f0f8ff", justifyContent: "center", alignItems: "center", marginRight: 16 },
  summaryItemDetails: { flex: 1 },
  summaryItemName: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  summaryItemCategory: { fontSize: 12, color: "#888" },
  summaryFooter: { padding: 24, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" }
});

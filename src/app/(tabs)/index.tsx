import { getSmartMatch, SmartMatchResult } from "@/services/recommendations";
import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DUMMY_USER_ID = "user-123";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [itemsScanned, setItemsScanned] = useState(0);
  const [points, setPoints] = useState(0);
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [bestLocation, setBestLocation] = useState<SmartMatchResult | null>(
    null,
  );

  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchStats();
    refreshRecommendation();
    startBreathing();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("total_items_scanned, pending_points, approved_points")
        .eq("user_id", DUMMY_USER_ID)
        .single();
      if (data) {
        setItemsScanned(data.total_items_scanned || 0);
        setPoints((data.pending_points || 0) + (data.approved_points || 0));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshRecommendation = async () => {
    try {
      const { data } = await supabase
        .from("scans_history")
        .select("category")
        .eq("user_id", DUMMY_USER_ID)
        .eq("status", "pending");

      if (data && data.length > 0) {
        const categories = data.map((item) => item.category);
        setScannedItems(categories);
        const recommendation = await getSmartMatch(categories);
        setBestLocation(recommendation);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startBreathing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const ringScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.12],
  });
  const ringOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.8],
  });
  const glowOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.18],
  });
  const glowScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: 40 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.hey}>Hey,</Text>
        <Text style={styles.name}>Adi</Text>
        <Text style={styles.tagline}>Ready to rekindle something today?</Text>
      </View>

      <View style={styles.scanWrapper}>
        <Animated.View
          style={[
            styles.glowCircle,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.breatheRing,
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push("/camera")}
          activeOpacity={0.85}
        >
          <View style={styles.scanIconWrapper}>
            <Ionicons name="scan" size={38} color="#0a0a0a" />
          </View>
          <Text style={styles.scanLabel}>Tap to scan</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Point the camera at whatever you're ready to donate.{"\n"}
        We'll batch it up and route it to the right ReKindle location.
      </Text>

      {bestLocation && (
        <View style={styles.recommendationCard}>
          <View style={styles.recHeader}>
            <Ionicons name="sparkles" size={16} color="#5bc4f5" />
            <Text style={styles.recTitle}>SMART MATCH</Text>
          </View>
          <Text style={styles.recName}>{bestLocation.location_name}</Text>
          <Text style={styles.recAddress}>{bestLocation.location_address}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              +{bestLocation.total_score} Utility Points
            </Text>
          </View>
          <Text style={styles.recSubtext}>
            Best hub for your {scannedItems.length} pending{" "}
            {scannedItems.length === 1 ? "item" : "items"}.
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="bag-handle-outline" size={18} color="#5bc4f5" />
          </View>
          <Text style={styles.statLabel}>ITEMS SCANNED</Text>
          <Text style={styles.statValue}>{itemsScanned}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="star-outline" size={18} color="#5bc4f5" />
          </View>
          <Text style={styles.statLabel}>YOUR POINTS</Text>
          <Text style={styles.statValue}>{points}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { paddingHorizontal: 24, alignItems: "center" },
  header: { width: "100%", marginBottom: 40 },
  hey: { fontSize: 18, color: "#888", fontWeight: "400" },
  name: {
    fontSize: 48,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1,
    lineHeight: 52,
  },
  tagline: { fontSize: 15, color: "#555", marginTop: 6 },
  scanWrapper: {
    width: 260,
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  glowCircle: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#5bc4f5",
  },
  breatheRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: "#5bc4f5",
  },
  scanButton: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#5bc4f5",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#5bc4f5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  scanIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanLabel: { fontSize: 20, fontWeight: "700", color: "#0a0a0a" },
  hint: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  recommendationCard: {
    width: "100%",
    backgroundColor: "#111",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    marginBottom: 14,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recTitle: {
    color: "#5bc4f5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  recName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  recAddress: { color: "#888", fontSize: 13, marginTop: 4 },
  scoreBadge: {
    backgroundColor: "rgba(91,196,245,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  scoreText: { color: "#5bc4f5", fontWeight: "700", fontSize: 12 },
  recSubtext: {
    color: "#555",
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic",
  },
  statsRow: { flexDirection: "row", gap: 14, width: "100%" },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(91,196,245,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    color: "#5bc4f5",
  },
});

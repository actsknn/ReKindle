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

  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    fetchStats();
    startAnimations();
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

  const startAnimations = () => {
    // Spin loop
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: 40 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.hey}>Hey,</Text>
        <Text style={styles.name}>Adi</Text>
        <Text style={styles.tagline}>Ready to rekindle something today?</Text>
      </View>

      {/* Scan Button */}
      <View style={styles.scanWrapper}>
        {/* Faint blue glow background */}
        <Animated.View style={[styles.glowCircle, { opacity: glowAnim }]} />

        {/* Spinning arc ring */}
        <Animated.View
          style={[styles.spinRing, { transform: [{ rotate: spin }] }]}
        >
          {/* Arc — just a bordered circle with one side transparent */}
          <View style={styles.arc} />
        </Animated.View>

        {/* Main Button */}
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

      {/* Hint */}
      <Text style={styles.hint}>
        Point the camera at whatever you're ready to donate.{"\n"}
        We'll batch it up and route it to the right ReKindle location.
      </Text>

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#0d1f2d" }]}>
            <Ionicons name="bag-handle-outline" size={18} color="#5bc4f5" />
          </View>
          <Text style={styles.statLabel}>ITEMS SCANNED</Text>
          <Text style={[styles.statValue, { color: "#5bc4f5" }]}>
            {itemsScanned}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#0d1f2d" }]}>
            <Ionicons name="star-outline" size={18} color="#5bc4f5" />
          </View>
          <Text style={styles.statLabel}>YOUR POINTS</Text>
          <Text style={[styles.statValue, { color: "#5bc4f5" }]}>{points}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  header: {
    width: "100%",
    marginBottom: 40,
  },
  hey: {
    fontSize: 18,
    color: "#888",
    fontWeight: "400",
  },
  name: {
    fontSize: 48,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1,
    lineHeight: 52,
  },
  tagline: {
    fontSize: 15,
    color: "#555",
    marginTop: 6,
  },
  scanWrapper: {
    width: 260,
    height: 260,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  glowCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#5bc4f5",
    opacity: 0.08,
  },
  spinRing: {
    position: "absolute",
    width: 224,
    height: 224,
    borderRadius: 112,
    justifyContent: "center",
    alignItems: "center",
  },
  arc: {
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 2.5,
    borderColor: "#5bc4f5",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
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
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0a0a0a",
  },
  hint: {
    fontSize: 13,
    color: "#444",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 14,
    width: "100%",
  },
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
  },
});

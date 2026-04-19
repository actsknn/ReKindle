import { supabase } from "@/services/supabase"; // <-- ADDED SUPABASE IMPORTS
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; // <-- ADDED FOR LIVE UPDATES
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ... (keep all your type definitions and CATEGORY_ICONS, UPCOMING, and HISTORY mock data exactly as they were) ...

type UpcomingDropOff = {
  id: string;
  location: string;
  when: string;
  itemCount: number;
  distance: string;
};

type ScanItem = {
  id: string;
  name: string;
  category: string;
  credits: number;
  dollars: number;
};

type ScanTrip = {
  id: string;
  date: string;
  status: "dropped_off" | "pending";
  location: string;
  items: ScanItem[];
};

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: "laptop-outline",
  "Clothing & Accessories": "shirt-outline",
  Furniture: "bed-outline",
  "Books & Media": "book-outline",
  Books: "book-outline",
  Kitchenware: "restaurant-outline",
  Appliances: "restaurant-outline",
  "Toys & Games": "game-controller-outline",
  "Home Decor": "home-outline",
  Home: "home-outline",
  "Tools & Hardware": "hammer-outline",
  "Sports & Outdoors": "bicycle-outline",
  "Baby & Kids": "happy-outline",
};

const UPCOMING: UpcomingDropOff[] = [
  {
    id: "u1",
    location: "ReKindle · Midtown",
    when: "Tomorrow · 10:00 AM",
    itemCount: 6,
    distance: "0.8 mi",
  },
  {
    id: "u2",
    location: "ReKindle · Riverside",
    when: "Sat, Apr 26 · 2:00 PM",
    itemCount: 3,
    distance: "2.3 mi",
  },
];

const HISTORY: ScanTrip[] = [
  {
    id: "h1",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "dropped_off",
    location: "Midtown",
    items: [
      {
        id: "i1",
        name: 'MacBook Pro 13"',
        category: "Electronics",
        credits: 6200,
        dollars: 620,
      },
      {
        id: "i2",
        name: "Wool overcoat",
        category: "Clothing & Accessories",
        credits: 450,
        dollars: 45,
      },
    ],
  },
  {
    id: "h2",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "pending",
    location: "Riverside",
    items: [
      {
        id: "i3",
        name: "Desk lamp",
        category: "Home Decor",
        credits: 0,
        dollars: 0,
      },
    ],
  },
  {
    id: "h3",
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: "dropped_off",
    location: "Highland",
    items: [
      {
        id: "i4",
        name: "Paperback books",
        category: "Books & Media",
        credits: 200,
        dollars: 20,
      },
      {
        id: "i5",
        name: "Kitchen mixer",
        category: "Kitchenware",
        credits: 200,
        dollars: 20,
      },
    ],
  },
  {
    id: "h4",
    date: new Date(Date.now() - 22 * 86400000).toISOString(),
    status: "dropped_off",
    location: "Midtown",
    items: [
      {
        id: "i6",
        name: "Vintage denim jacket",
        category: "Clothing & Accessories",
        credits: 150,
        dollars: 15,
      },
    ],
  },
];

function formatRelativeDate(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays <= 7) return `${diffDays} days ago`;

  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear ? `${month} ${day}` : `${month} ${day}, ${d.getFullYear()}`;
}


const DUMMY_USER_ID = "user-123";

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  const [expandedTrip, setExpandedTrip] = useState<string | null>("h1");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // --- CHANGED THESE FROM CONST TO LIVE STATE VARIABLES ---
  const [readyCredits, setReadyCredits] = useState(0);
  const [pendingCredits, setPendingCredits] = useState(0);
  const [itemsDonated, setItemsDonated] = useState(0);
  const [totalDonated, setTotalDonated] = useState(0);

  // --- ADDED FETCH TO PULL FROM DATABASE EVERY TIME YOU VIEW THE SCREEN ---
  useFocusEffect(
    useCallback(() => {
      fetchImpactStats();
    }, [])
  );

  const fetchImpactStats = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("total_items_scanned, pending_points, approved_points")
        .eq("user_id", DUMMY_USER_ID)
        .single();

      if (data) {
        setPendingCredits(data.pending_points || 0);
        setReadyCredits(data.approved_points || 0);
        setItemsDonated(data.total_items_scanned || 0);
        
        // Let's assume dollars is roughly 10% of approved points plus some base value for the demo
        setTotalDonated((data.approved_points || 0) / 10);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (id: string) => {
    setOpenMenu(null);
    Alert.alert("Edit batch", "You can edit the items in this batch.");
  };

  const handleCancel = (id: string) => {
    setOpenMenu(null);
    Alert.alert(
      "Cancel drop-off",
      "Are you sure you want to cancel this drop-off?",
      [
        { text: "Keep", style: "cancel" },
        { text: "Cancel it", style: "destructive" },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
    >
      <Text style={styles.eyebrow}>YOUR IMPACT</Text>
      <Text style={styles.title}>This year, so far</Text>

      {/* Hero Credits Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroLabel}>REKINDLE CREDITS</Text>
          <Text style={styles.heroValue}>{readyCredits}</Text>
          <Text style={styles.heroCaption}>
            ≈ ${(readyCredits / 10).toFixed(2)} in store credit · 10¢ per credit
          </Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons
            name="cash-outline"
            size={80}
            color="rgba(255,255,255,0.25)"
          />
        </View>
      </View>

      {pendingCredits > 0 && (
        <View style={styles.pendingPill}>
          <Ionicons name="hourglass-outline" size={14} color="#5bc4f5" />
          <Text style={styles.pendingText}>
            +{pendingCredits} credits pending review
          </Text>
        </View>
      )}

      {/* Stat cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="bag-handle-outline" size={16} color="#5bc4f5" />
          </View>
          <Text style={styles.statLabel}>ITEMS DONATED</Text>
          <Text style={styles.statValue}>{itemsDonated}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="cash-outline" size={16} color="#5bc4f5" />
          </View>
          <Text style={styles.statLabel}>TOTAL DONATED</Text>
          <Text style={styles.statValue}>${totalDonated.toFixed(2)}</Text>
        </View>
      </View>

      {/* Upcoming drop-offs */}
      <Text style={styles.sectionTitle}>Upcoming drop-offs</Text>
      {UPCOMING.map((u) => (
        <View key={u.id} style={styles.upcomingCard}>
          <View style={styles.upcomingIcon}>
            <Ionicons name="calendar-outline" size={22} color="#5bc4f5" />
          </View>
          <View style={styles.upcomingContent}>
            <Text style={styles.upcomingLocation}>{u.location}</Text>
            <Text style={styles.upcomingMeta}>
              {u.when} · {u.itemCount} items
            </Text>
          </View>
          <Text style={styles.upcomingDistance}>{u.distance}</Text>
          <TouchableOpacity
            onPress={() => setOpenMenu(openMenu === u.id ? null : u.id)}
            style={styles.menuBtn}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#888" />
          </TouchableOpacity>
          {openMenu === u.id && (
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleChange(u.id)}
              >
                <Ionicons name="create-outline" size={16} color="#5bc4f5" />
                <Text style={styles.menuText}>Change</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleCancel(u.id)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={16}
                  color="#ff4444"
                />
                <Text style={[styles.menuText, { color: "#ff4444" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {/* Full scan history */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Full scan history</Text>
        <Text style={styles.historyCount}>{HISTORY.length} trips</Text>
      </View>

      {HISTORY.map((t) => {
        const expanded = expandedTrip === t.id;
        const totalCredits = t.items.reduce((s, i) => s + i.credits, 0);
        const totalDollars = t.items.reduce((s, i) => s + i.dollars, 0);

        return (
          <View key={t.id} style={styles.historyCard}>
            <TouchableOpacity
              style={styles.historyRow}
              onPress={() => setExpandedTrip(expanded ? null : t.id)}
              activeOpacity={0.7}
            >
              <View style={styles.historyIcon}>
                <Ionicons name="calendar-outline" size={20} color="#5bc4f5" />
              </View>
              <View style={styles.historyMiddle}>
                <Text style={styles.historyDate}>
                  {formatRelativeDate(t.date)}
                </Text>
                <Text style={styles.historyMeta}>
                  {t.items.length} items · {t.location}
                </Text>
              </View>
              <View style={styles.historyRight}>
                <View
                  style={[
                    styles.statusPill,
                    t.status === "pending"
                      ? styles.statusPillPending
                      : styles.statusPillDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      t.status === "pending"
                        ? styles.statusTextPending
                        : styles.statusTextDone,
                    ]}
                  >
                    {t.status === "pending" ? "PENDING REVIEW" : "DROPPED OFF"}
                  </Text>
                </View>
                <Text style={styles.historyCredits}>+{totalCredits}c</Text>
                <Text style={styles.historyDollars}>${totalDollars}</Text>
              </View>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#666"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            {expanded && (
              <View style={styles.historyBody}>
                <View style={styles.miniStatsRow}>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatLabel}>ITEMS</Text>
                    <Text style={styles.miniStatValue}>{t.items.length}</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatLabel}>MONEY</Text>
                    <Text style={styles.miniStatValue}>${totalDollars}</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatLabel}>CREDITS</Text>
                    <Text style={styles.miniStatValue}>{totalCredits}</Text>
                  </View>
                </View>

                {t.items.map((it) => (
                  <View key={it.id} style={styles.itemRow}>
                    <View style={styles.itemThumb}>
                      <Ionicons
                        name={
                          (CATEGORY_ICONS[it.category] || "cube-outline") as any
                        }
                        size={22}
                        color="#5bc4f5"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{it.name}</Text>
                      <Text style={styles.itemCategory}>{it.category}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.itemCredits}>+{it.credits}c</Text>
                      <Text style={styles.itemDollars}>${it.dollars}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  eyebrow: {
    color: "#5bc4f5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: "#5bc4f5",
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  heroTextBlock: { flex: 1 },
  heroLabel: {
    color: "#0a0a0a",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroValue: {
    color: "#ffffff",
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -2,
    lineHeight: 60,
  },
  heroCaption: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 6,
  },
  heroIcon: {
    position: "absolute",
    right: -10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  pendingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(91,196,245,0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  pendingText: { color: "#5bc4f5", fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    gap: 6,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(91,196,245,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statValue: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 32,
    marginBottom: 12,
  },
  upcomingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    marginBottom: 10,
    position: "relative",
  },
  upcomingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(91,196,245,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  upcomingContent: { flex: 1 },
  upcomingLocation: { color: "#fff", fontSize: 15, fontWeight: "700" },
  upcomingMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  upcomingDistance: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  menuBtn: { padding: 6 },
  menu: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    width: 130,
    zIndex: 10,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuDivider: { height: 1, backgroundColor: "#2a2a2a" },
  menuText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  historyHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 32,
    marginBottom: 12,
  },
  historyCount: { color: "#666", fontSize: 13 },
  historyCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    marginBottom: 10,
    overflow: "hidden",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(91,196,245,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyMiddle: { flex: 1 },
  historyDate: { color: "#fff", fontSize: 15, fontWeight: "700" },
  historyMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  historyRight: { alignItems: "flex-end", gap: 2 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusPillDone: { backgroundColor: "rgba(91,196,245,0.18)" },
  statusPillPending: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#5bc4f5",
  },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  statusTextDone: { color: "#5bc4f5" },
  statusTextPending: { color: "#5bc4f5" },
  historyCredits: { color: "#5bc4f5", fontSize: 16, fontWeight: "800" },
  historyDollars: { color: "#666", fontSize: 11 },
  historyBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e1e1e",
    gap: 10,
  },
  miniStatsRow: { flexDirection: "row", gap: 8 },
  miniStat: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  miniStatLabel: {
    color: "#666",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  miniStatValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(91,196,245,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  itemCategory: { color: "#888", fontSize: 12, marginTop: 2 },
  itemCredits: { color: "#5bc4f5", fontSize: 14, fontWeight: "800" },
  itemDollars: { color: "#666", fontSize: 11 },
});

import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Matches your camera.tsx dummy user
const USER_ID = "user-123";

// --- Types ---
type Profile = {
  user_id: string;
  total_items_scanned: number;
  pending_points: number;
  approved_points: number;
};

type Scan = {
  id: string;
  user_id: string;
  category: string;
  item_name: string;
  points_awarded: number; // Matches your Supabase DB column
  status: string;
  created_at: string;
};

type UpcomingItem = { id: string; name: string; category: string };

type UpcomingDrop = {
  id: string;
  location: string;
  when: string;
  items: UpcomingItem[];
};

// --- Helpers ---
const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  const c = (category || "").toLowerCase();
  
  if (c.includes("electronic") || c.includes("tech")) return "laptop-outline";
  if (c.includes("cloth") || c.includes("apparel") || c.includes("footwear") || c.includes("accessories")) return "shirt-outline";
  if (c.includes("book") || c.includes("media") || c.includes("entertainment")) return "book-outline";
  if (c.includes("furniture") || c.includes("linen") || c.includes("domestics")) return "bed-outline";
  if (c.includes("appliance") || c.includes("kitchen") || c.includes("houseware")) return "home-outline";
  if (c.includes("toy") || c.includes("game")) return "game-controller-outline";
  if (c.includes("tool") || c.includes("hardware")) return "hammer-outline";
  if (c.includes("sport") || c.includes("outdoor")) return "bicycle-outline";
  if (c.includes("antique") || c.includes("collectible")) return "star-outline";
  
  return "cube-outline"; 
};

const formatRelativeDate = (iso: string) => {
  if (!iso) return "Today";
  const now = new Date();
  const then = new Date(iso);
  const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays <= 7) return `${diffDays} days ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Mock data for the teammate's Upcoming Drops UI
const initialUpcoming: UpcomingDrop[] = [
  {
    id: "u1",
    location: "Goodwill · Midtown",
    when: "Tomorrow · 10:00 AM",
    items: [
      { id: "i1", name: "Denim jacket", category: "clothing" },
      { id: "i2", name: "Wool sweater", category: "clothing" },
      { id: "i3", name: "Old iPhone 11", category: "electronics" },
    ],
  },
  {
    id: "u2",
    location: "Goodwill · Riverside",
    when: "Sat · 11:00 AM",
    items: [
      { id: "i4", name: "Desk lamp", category: "furniture" },
    ],
  },
];

export default function ImpactScreen() {
  const insets = useSafeAreaInsets();
  
  // --- State ---
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [upcoming, setUpcoming] = useState<UpcomingDrop[]>(initialUpcoming);
  const [changeModalFor, setChangeModalFor] = useState<string | null>(null);
  const [addItemText, setAddItemText] = useState("");

  // --- Data Fetching ---
  const load = async () => {
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", USER_ID)
        .single();

      const { data: s } = await supabase
        .from("scans_history")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: false });

      if (p) setProfile(p);
      if (s) setScans(s);
    } catch (e) {
      console.log("[impact] load error", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // --- Data Processing ---
  const trips = useMemo(() => {
    const byDate = new Map<string, Scan[]>();
    for (const s of scans) {
      const key = (s.created_at || new Date().toISOString()).slice(0, 10);
      const arr = byDate.get(key) ?? [];
      arr.push(s);
      byDate.set(key, arr);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({
        id: date,
        date,
        items,
        totalCredits: items.reduce((sum, it) => sum + (it.points_awarded || 0), 0),
        status: items.every((it) => it.status === "approved") ? "approved" : "pending",
      }));
  }, [scans]);

  const visibleTrips = showAllHistory ? trips : trips.slice(0, 3);

  // --- Computed Stats ---
  const readyCredits = profile?.approved_points ?? 0;
  const pendingCredits = profile?.pending_points ?? 0;
  const totalItems = profile?.total_items_scanned ?? 0;
  const lifetimeCredits = readyCredits + pendingCredits;

  // --- Handlers ---
  const handleCancel = (dropId: string) => {
    setOpenMenuId(null);
    Alert.alert(
      "Cancel drop-off?",
      "Are you sure you want to cancel this batch?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            setUpcoming((prev) => prev.filter((d) => d.id !== dropId));
          },
        },
      ]
    );
  };

  const handleChange = (dropId: string) => {
    setOpenMenuId(null);
    setChangeModalFor(dropId);
  };

  const removeItemFromDrop = (dropId: string, itemId: string) => {
    setUpcoming((prev) =>
      prev.map((d) =>
        d.id === dropId ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d
      )
    );
  };

  const addItemToDrop = (dropId: string) => {
    const name = addItemText.trim();
    if (!name) return;
    setUpcoming((prev) =>
      prev.map((d) =>
        d.id === dropId
          ? {
              ...d,
              items: [...d.items, { id: `i${Date.now()}`, name, category: "other" }],
            }
          : d
      )
    );
    setAddItemText("");
  };

  const changeModalDrop = upcoming.find((d) => d.id === changeModalFor) ?? null;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5bc4f5" />}
      >
        <Text style={styles.pageTitle}>Impact</Text>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>READY TO SPEND</Text>
            <Text style={styles.heroValue}>{readyCredits}</Text>
            <Text style={styles.heroSub}>
              credits · ≈ ${(readyCredits * 0.10).toFixed(2)}
            </Text>
            {pendingCredits > 0 && (
              <View style={styles.pendingPill}>
                <Ionicons name="time-outline" size={14} color="#ffd66b" />
                <Text style={styles.pendingPillText}>
                  +{pendingCredits} credits pending review
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Items donated</Text>
            <Text style={styles.statValue}>{totalItems}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Lifetime credits</Text>
            <Text style={styles.statValue}>{lifetimeCredits}</Text>
          </View>
        </View>

        {/* Upcoming drop-offs */}
        <Text style={styles.section}>Upcoming drop-offs</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="cube-outline" size={22} color="#444" />
              <Text style={styles.emptyText}>No upcoming drop-offs scheduled.</Text>
            </View>
          </View>
        ) : (
          upcoming.map((d) => (
            <View key={d.id} style={styles.upcomingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upcomingLocation}>{d.location}</Text>
                <Text style={styles.upcomingWhen}>{d.when}</Text>
                <Text style={styles.upcomingMeta}>{d.items.length} items</Text>
              </View>
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  style={styles.dotsBtn}
                  onPress={() => setOpenMenuId(openMenuId === d.id ? null : d.id)}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                </TouchableOpacity>
                {openMenuId === d.id && (
                  <View style={styles.menu}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleChange(d.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={20} color="#5bc4f5" />
                      <Text style={styles.menuText}>Change</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => handleCancel(d.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#ff6b6b" />
                      <Text style={[styles.menuText, { color: "#ff6b6b" }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}

        {/* Scan History (Live from Supabase) */}
        <Text style={styles.section}>Scan history</Text>
        {trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="scan-outline" size={22} color="#444" />
              <Text style={styles.emptyText}>No scans yet. Start by scanning an item.</Text>
            </View>
          </View>
        ) : (
          <>
            {visibleTrips.map((trip) => {
              const isOpen = expandedTrip === trip.id;
              const isApproved = trip.status === "approved";
              return (
                <View key={trip.id} style={styles.tripCard}>
                  <TouchableOpacity
                    style={styles.tripHeader}
                    onPress={() => setExpandedTrip(isOpen ? null : trip.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tripDate}>{formatRelativeDate(trip.date)}</Text>
                      <Text style={styles.tripMeta}>
                        {trip.items.length} {trip.items.length === 1 ? "item" : "items"} · {trip.totalCredits} credits
                      </Text>
                    </View>
                    <View style={[styles.statusPill, isApproved ? styles.approvedPill : styles.pendingPillStatus]}>
                      <Text style={[styles.statusText, isApproved ? styles.approvedText : styles.pendingTextStatus]}>
                        {isApproved ? "Approved" : "Pending"}
                      </Text>
                    </View>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="#888" style={{ marginLeft: 10 }} />
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.tripBody}>
                      {trip.items.map((it) => (
                        <View key={it.id} style={styles.tripItem}>
                          <View style={styles.itemIconWrap}>
                            <Ionicons name={getCategoryIcon(it.category)} size={18} color="#5bc4f5" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{it.item_name}</Text>
                            <Text style={styles.itemCategory}>{it.category}</Text>
                          </View>
                          <Text style={styles.itemCredits}>+{it.points_awarded}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}

            {trips.length > 3 && (
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={() => setShowAllHistory(!showAllHistory)}
                activeOpacity={0.8}
              >
                <Text style={styles.showMoreText}>
                  {showAllHistory ? "Show less" : `Show more (${trips.length - 3})`}
                </Text>
                <Ionicons name={showAllHistory ? "chevron-up" : "chevron-down"} size={16} color="#5bc4f5" />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Change Modal */}
      <Modal
        visible={!!changeModalFor}
        transparent
        animationType="slide"
        onRequestClose={() => setChangeModalFor(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setChangeModalFor(null)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{changeModalDrop?.location}</Text>
            <Text style={styles.modalSubtitle}>{changeModalDrop?.when}</Text>

            <Text style={styles.modalSection}>Items in this batch</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {(changeModalDrop?.items ?? []).length === 0 ? (
                <Text style={styles.emptyText}>No items in this batch yet.</Text>
              ) : (
                changeModalDrop?.items.map((it) => (
                  <View key={it.id} style={styles.modalItem}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name={getCategoryIcon(it.category)} size={18} color="#5bc4f5" />
                    </View>
                    <Text style={styles.modalItemName}>{it.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeItemFromDrop(changeModalDrop.id, it.id)}
                      style={styles.removeBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <Text style={styles.modalSection}>Add item</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="e.g. Winter coat"
                placeholderTextColor="#555"
                value={addItemText}
                onChangeText={setAddItemText}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => changeModalDrop && addItemToDrop(changeModalDrop.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={22} color="#0a0a0a" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => setChangeModalFor(null)} activeOpacity={0.8}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 20 },
  
  hero: { backgroundColor: "#111", borderRadius: 20, padding: 22, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#1e1e1e" },
  heroTextBlock: { flex: 1 },
  heroLabel: { color: "#888", fontSize: 11, fontWeight: "600", letterSpacing: 1.2, marginBottom: 4 },
  heroValue: { color: "#fff", fontSize: 54, fontWeight: "700" },
  heroSub: { color: "#888", fontSize: 13, marginTop: 2 },
  
  pendingPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 214, 107, 0.12)", borderColor: "rgba(255, 214, 107, 0.35)", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: "flex-start", marginTop: 12, gap: 6 },
  pendingPillText: { color: "#ffd66b", fontSize: 12, fontWeight: "500" },
  
  statRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: "#111", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1e1e1e", gap: 6 },
  statLabel: { color: "#888", fontSize: 12 },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 6 },
  
  section: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 28, marginBottom: 12 },
  
  upcomingCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 10 },
  upcomingLocation: { color: "#fff", fontSize: 15, fontWeight: "600" },
  upcomingWhen: { color: "#5bc4f5", fontSize: 13, marginTop: 2 },
  upcomingMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  dotsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  
  menu: { position: "absolute", top: 42, right: 0, backgroundColor: "#1a1a1a", borderRadius: 12, borderWidth: 1, borderColor: "#2a2a2a", paddingVertical: 6, minWidth: 170, zIndex: 50 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 18, gap: 14 },
  menuText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  menuDivider: { height: 1, backgroundColor: "#2a2a2a", marginHorizontal: 8 },
  
  emptyCard: { backgroundColor: "#111", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#1e1e1e", justifyContent: "space-between", marginBottom: 12 },
  emptyText: { color: "#555", fontSize: 13 },
  
  tripCard: { backgroundColor: "#111", borderRadius: 16, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 10, overflow: "hidden" },
  tripHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  tripDate: { color: "#fff", fontSize: 15, fontWeight: "600" },
  tripMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginLeft: 8 },
  approvedPill: { backgroundColor: "rgba(80, 210, 140, 0.15)", borderWidth: 1, borderColor: "rgba(80, 210, 140, 0.4)" },
  pendingPillStatus: { backgroundColor: "rgba(255, 214, 107, 0.12)", borderWidth: 1, borderColor: "rgba(255, 214, 107, 0.35)" },
  statusText: { fontSize: 11, fontWeight: "600" },
  approvedText: { color: "#50d28c" },
  pendingTextStatus: { color: "#ffd66b" },
  
  tripBody: { borderTopWidth: 1, borderTopColor: "#1e1e1e", paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6 },
  tripItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  itemIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(91, 196, 245, 0.1)", justifyContent: "center", alignItems: "center", marginRight: 12 },
  itemName: { color: "#fff", fontSize: 14, fontWeight: "500" },
  itemCategory: { color: "#888", fontSize: 12, marginTop: 2 },
  itemCredits: { color: "#5bc4f5", fontSize: 14, fontWeight: "600" },
  
  showMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#111", borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: "#1e1e1e", marginTop: 6 },
  showMoreText: { color: "#5bc4f5", fontSize: 14, fontWeight: "600" },
  
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40, borderTopWidth: 1, borderColor: "#1e1e1e" },
  modalHandle: { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  modalSubtitle: { color: "#5bc4f5", fontSize: 14, marginTop: 4 },
  modalSection: { color: "#888", fontSize: 12, fontWeight: "600", letterSpacing: 1, marginTop: 20, marginBottom: 8, textTransform: "uppercase" },
  modalItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  modalItemName: { color: "#fff", fontSize: 15, flex: 1 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,107,107,0.12)", justifyContent: "center", alignItems: "center" },
  
  addRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  addInput: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", borderWidth: 1, borderColor: "#2a2a2a" },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#5bc4f5", justifyContent: "center", alignItems: "center" },
  doneBtn: { marginTop: 22, backgroundColor: "#5bc4f5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  doneText: { color: "#0a0a0a", fontSize: 15, fontWeight: "700" }
});
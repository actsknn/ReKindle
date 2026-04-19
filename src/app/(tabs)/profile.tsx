import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DISPLAY_NAME = "Adi";
const EMAIL = "rekindify@gmail.com";

type SettingRow = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SETTINGS: SettingRow[] = [
  { id: "account", label: "Account", icon: "person-outline" },
  { id: "privacy", label: "Privacy", icon: "lock-closed-outline" },
  {
    id: "notifications",
    label: "Notifications",
    icon: "notifications-outline",
  },
  { id: "theme", label: "Theme", icon: "color-palette-outline" },
  { id: "language", label: "Language", icon: "globe-outline" },
  { id: "payments", label: "Payments & credits", icon: "card-outline" },
  { id: "help", label: "Help & support", icon: "help-circle-outline" },
  { id: "about", label: "About ReKindle", icon: "information-circle-outline" },
  { id: "signout", label: "Sign out", icon: "log-out-outline" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
    >
      <Text style={styles.eyebrow}>PROFILE</Text>
      <Text style={styles.title}>Your account</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {DISPLAY_NAME.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{DISPLAY_NAME}</Text>
          <Text style={styles.profileEmail}>{EMAIL}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>
      <View style={styles.settingsList}>
        {SETTINGS.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.settingRow,
              i !== SETTINGS.length - 1 && styles.settingRowBorder,
            ]}
            onPress={() => Alert.alert(s.label, "This section is coming soon.")}
            activeOpacity={0.6}
          >
            <View style={styles.settingIcon}>
              <Ionicons name={s.icon} size={18} color="#5bc4f5" />
            </View>
            <Text style={styles.settingLabel}>{s.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#555" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>ReKindle v0.1.0</Text>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#5bc4f5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#0a0a0a", fontSize: 28, fontWeight: "800" },
  profileName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  profileEmail: { color: "#888", fontSize: 13, marginTop: 2 },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 10,
  },
  settingsList: {
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(91,196,245,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "600" },
  version: {
    color: "#444",
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
  },
});

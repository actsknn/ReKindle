import { Ionicons } from "@expo/vector-icons";
import {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IoniconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, IoniconName> = {
  index: "home",
  map: "map",
  impact: "leaf",
  profile: "person",
};

const TAB_LABELS: Record<string, string> = {
  index: "Home",
  map: "Map",
  impact: "Impact",
  profile: "Profile",
};

function FloatingIsland({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 14 }]}
    >
      <View style={styles.island}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const iconName: IoniconName = TAB_ICONS[route.name] ?? "ellipse";
          const label = TAB_LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,
                focused && styles.tabFocused,
                pressed && styles.tabPressed,
              ]}
            >
              <Ionicons
                name={iconName}
                size={20}
                color={focused ? "#0a0a0a" : "#dcdcdc"}
              />
              <Text
                style={[styles.label, focused && styles.labelFocused]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Reserve space at the bottom of every screen so the floating island
  // never blocks scrollable content underneath it.
  const ISLAND_HEIGHT = 56;
  const ISLAND_GAP = 14;
  const reservedBottom = insets.bottom + ISLAND_HEIGHT + ISLAND_GAP + 12;

  const screenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    sceneStyle: { backgroundColor: "#0a0a0a", paddingBottom: reservedBottom },
  };

  return (
    <Tabs
      screenOptions={screenOptions}
      tabBar={(props) => <FloatingIsland {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="impact" options={{ title: "Impact" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    // The wrapper itself doesn't catch touches (pointerEvents="box-none"),
    // so taps outside the island still pass through to whatever is beneath.
  },
  island: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,20,20,0.92)",
    borderRadius: 32,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    gap: 6,
  },
  tabFocused: {
    backgroundColor: "#5bc4f5",
  },
  tabPressed: {
    opacity: 0.75,
  },
  label: {
    color: "#dcdcdc",
    fontSize: 12,
    fontWeight: "600",
  },
  labelFocused: {
    color: "#0a0a0a",
    fontWeight: "700",
  },
});

import { supabase } from "@/services/supabase";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Callout,
  Circle,
  Marker,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Maps your database 'demand_level' to your teammate's UI colors
const NEED_COLORS: Record<string, string> = {
  High: "#E85D4E", // Urgent Red
  Medium: "#E8B84E", // Warning Orange
  Low: "#7BC79A", // Healthy Green
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userCoord, setUserCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const focusLocation = (loc: any) => {
    setSelectedId(loc.id);
    mapRef.current?.animateToRegion(
      {
        latitude: loc.coord.latitude,
        longitude: loc.coord.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600,
    );
  };

  // Rough distance in miles between two coords (haversine)
  const distanceMiles = (
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
  ) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 3958.8; // Earth radius in miles
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserCoord({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }

      const { data, error } = await supabase.from("locations").select(`
          id,
          name,
          address,
          latitude,
          longitude,
          location_demand (
            category_name,
            demand_level
          )
        `);

      if (error) {
        console.error("Supabase Error:", error.message);
        return;
      }

      if (data) {
        const formatted = data.map((loc: any) => {
          const demands = loc.location_demand || [];
          const isHigh = demands.some((d: any) => d.demand_level === "High");
          const isMedium = demands.some(
            (d: any) => d.demand_level === "Medium",
          );

          return {
            id: loc.id,
            name: loc.name,
            address: loc.address,
            coord: {
              latitude: parseFloat(loc.latitude),
              longitude: parseFloat(loc.longitude),
            },
            need: isHigh ? "High" : isMedium ? "Medium" : "Low",
            topNeeds: demands.map((d: any) => d.category_name).slice(0, 3),
          };
        });
        setLocations(formatted);
      }
    } catch (err) {
      console.error("Fetch Catch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDirections = (coord: { latitude: number; longitude: number }) => {
    Linking.openURL(
      `maps://?daddr=${coord.latitude},${coord.longitude}&dirflg=d`,
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0a0a0a",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0a0a0a" }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 80,
      }}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={styles.eyebrow}>LOCATIONS NEARBY</Text>
        <Text style={styles.h1}>Donation heat map</Text>
        <Text style={styles.sub}>Showing high-demand hubs in College Park</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View
          style={{
            borderRadius: 24,
            overflow: "hidden",
            height: 450,
            borderWidth: 1,
            borderColor: "#1a1a1a",
          }}
        >
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 38.9897, // UMD Coordinates
              longitude: -76.9378,
              latitudeDelta: 0.12,
              longitudeDelta: 0.12,
            }}
            userInterfaceStyle="dark"
            showsUserLocation={true}
          >
            {/* The Glow Rings */}
            {locations.map((loc) => (
              <React.Fragment key={`glow-${loc.id}`}>
                <Circle
                  center={loc.coord}
                  radius={1200}
                  fillColor={`${NEED_COLORS[loc.need]}22`}
                  strokeColor="transparent"
                />
                <Circle
                  center={loc.coord}
                  radius={600}
                  fillColor={`${NEED_COLORS[loc.need]}44`}
                  strokeColor="transparent"
                />
              </React.Fragment>
            ))}

            {/* The Pins */}
            {locations.map((loc) => (
              <Marker key={loc.id} coordinate={loc.coord}>
                <View
                  style={[
                    styles.pin,
                    { backgroundColor: NEED_COLORS[loc.need] },
                  ]}
                >
                  <View style={styles.pinDot} />
                </View>
                <Callout tooltip onPress={() => openDirections(loc.coord)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{loc.name}</Text>
                    <Text style={styles.calloutAddress}>{loc.address}</Text>

                    <Text style={styles.calloutLabel}>URGENT NEEDS</Text>
                    {loc.topNeeds.length > 0 ? (
                      loc.topNeeds.map((n: string, index: number) => (
                        /* FIXED KEY HERE */
                        <Text
                          key={`${loc.id}-${index}`}
                          style={styles.calloutNeed}
                        >
                          • {n}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.calloutNeed}>General Donations</Text>
                    )}

                    <Text style={styles.calloutDirections}>
                      Tap for Directions →
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      </View>

      {/* Bottom location menu — tap a card to focus that location on the map */}
      <View style={styles.menuWrap}>
        <View style={styles.menuHeaderRow}>
          <Text style={styles.menuHeader}>Pickup spots near you</Text>
          <Text style={styles.menuCount}>{locations.length} hubs</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
          snapToInterval={272}
          decelerationRate="fast"
        >
          {locations.map((loc) => {
            const isSelected = selectedId === loc.id;
            const dist = userCoord ? distanceMiles(userCoord, loc.coord) : null;
            const needColor = NEED_COLORS[loc.need] || "#7BC79A";
            return (
              <TouchableOpacity
                key={loc.id}
                activeOpacity={0.85}
                onPress={() => focusLocation(loc)}
                style={[
                  styles.locCard,
                  isSelected && {
                    borderColor: needColor,
                    shadowColor: needColor,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[styles.needDot, { backgroundColor: needColor }]}
                  />
                  <Text style={styles.needLabel}>{loc.need} demand</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {loc.name}
                </Text>
                <Text style={styles.cardAddress} numberOfLines={2}>
                  {loc.address}
                </Text>
                {dist !== null && (
                  <Text style={styles.cardDistance}>
                    {dist.toFixed(1)} miles away
                  </Text>
                )}
                {loc.topNeeds.length > 0 && (
                  <View style={styles.tagsRow}>
                    {loc.topNeeds.slice(0, 3).map((n: string, i: number) => (
                      <View key={`${loc.id}-tag-${i}`} style={styles.tag}>
                        <Text style={styles.tagText}>{n}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.viewOnMapRow}>
                  <Text style={[styles.viewOnMapText, { color: needColor }]}>
                    {isSelected ? "Showing on map" : "Tap to view on map →"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: "#888",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  h1: { color: "#fff", fontSize: 32, fontWeight: "800", marginBottom: 6 },
  sub: { color: "#888", fontSize: 14 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "white" },
  callout: {
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 14,
    minWidth: 220,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  calloutTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 2,
  },
  calloutAddress: { color: "#888", fontSize: 12 },
  calloutLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  calloutNeed: { color: "#ddd", fontSize: 13, marginBottom: 2 },
  calloutDirections: {
    color: "#4CAF50",
    fontWeight: "800",
    marginTop: 12,
    fontSize: 14,
  },
  menuWrap: {
    marginTop: 20,
  },
  menuHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuHeader: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  menuCount: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  locCard: {
    width: 260,
    marginRight: 12,
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  needDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  needLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardAddress: {
    color: "#888",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardDistance: {
    color: "#5bc4f5",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#1c1c1c",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#242424",
  },
  tagText: {
    color: "#ddd",
    fontSize: 11,
    fontWeight: "600",
  },
  viewOnMapRow: {
    marginTop: 2,
  },
  viewOnMapText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, {
    Callout,
    Circle,
    Marker,
    PROVIDER_DEFAULT,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NEED_COLORS = {
  urgent: "#E85D4E",
  medium: "#E8B84E",
  low: "#7BC79A",
} as const;

const LOCATIONS = [
  {
    id: "1",
    name: "Re Kindle Midtown",
    address: "245 W 47th St, New York, NY",
    coord: { latitude: 40.7589, longitude: -73.9851 },
    need: "urgent" as const,
    topNeeds: ["Warm coats", "Kitchen appliances", "Kids books"],
    hours: "Mon–Sat 9AM–7PM · Sun 10AM–5PM",
  },
  {
    id: "2",
    name: "Re Kindle East Side",
    address: "1140 2nd Ave, New York, NY",
    coord: { latitude: 40.7614, longitude: -73.966 },
    need: "medium" as const,
    topNeeds: ["Books", "Small furniture"],
    hours: "Mon–Sun 10AM–8PM",
  },
  {
    id: "3",
    name: "Re Kindle Downtown",
    address: "88 Fulton St, New York, NY",
    coord: { latitude: 40.7095, longitude: -74.0067 },
    need: "low" as const,
    topNeeds: ["Board games", "Men's shoes"],
    hours: "Mon–Fri 9AM–6PM · Sat 10AM–4PM",
  },
];

// Haversine distance in miles
function distanceMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function openDirections(coord: { latitude: number; longitude: number }) {
  Linking.openURL(
    `maps://?daddr=${coord.latitude},${coord.longitude}&dirflg=d`,
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [userCoord, setUserCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserCoord({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

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
        <Text style={styles.sub}>
          Where donations are most needed right now
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ borderRadius: 20, overflow: "hidden", height: 420 }}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 40.758,
              longitude: -73.9855,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            mapType="mutedStandard"
            userInterfaceStyle="dark"
            showsUserLocation
            showsMyLocationButton
            showsCompass
            showsScale
            pitchEnabled
            rotateEnabled
          >
            {LOCATIONS.map((loc) => (
              <React.Fragment key={`glow-${loc.id}`}>
                <Circle
                  center={loc.coord}
                  radius={600}
                  fillColor={`${NEED_COLORS[loc.need]}33`}
                  strokeColor="transparent"
                />
                <Circle
                  center={loc.coord}
                  radius={300}
                  fillColor={`${NEED_COLORS[loc.need]}55`}
                  strokeColor="transparent"
                />
              </React.Fragment>
            ))}

            {LOCATIONS.map((loc) => {
              const miles = userCoord
                ? distanceMiles(userCoord, loc.coord)
                : null;
              return (
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
                      {miles !== null && (
                        <Text style={styles.calloutDistance}>
                          {miles.toFixed(1)} miles away
                        </Text>
                      )}
                      <Text style={styles.calloutLabel}>NEEDS MOST</Text>
                      {loc.topNeeds.map((n) => (
                        <Text key={n} style={styles.calloutNeed}>
                          • {n}
                        </Text>
                      ))}
                      <Text style={styles.calloutLabel}>HOURS</Text>
                      <Text style={styles.calloutHours}>{loc.hours}</Text>
                      <Text style={styles.calloutDirections}>
                        Get Directions →
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
        </View>
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
    minWidth: 240,
    maxWidth: 260,
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
  calloutDistance: {
    color: "#E85D0C",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 4,
  },
  calloutLabel: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  calloutNeed: { color: "#ddd", fontSize: 13, marginBottom: 2 },
  calloutHours: { color: "#ddd", fontSize: 12 },
  calloutDirections: {
    color: "#E85D0C",
    fontWeight: "800",
    marginTop: 12,
    fontSize: 14,
  },
});

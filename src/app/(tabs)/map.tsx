import { supabase } from "@/services/supabase";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Maps your database 'demand_level' to your teammate's UI colors
const NEED_COLORS: Record<string, string> = {
  High: "#E85D4E",   // Urgent Red
  Medium: "#E8B84E", // Warning Orange
  Low: "#7BC79A",    // Healthy Green
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoord, setUserCoord] = useState<{ latitude: number; longitude: number } | null>(null);

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

      const { data, error } = await supabase
        .from('locations')
        .select(`
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
          const isHigh = demands.some((d: any) => d.demand_level === 'High');
          const isMedium = demands.some((d: any) => d.demand_level === 'Medium');
          
          return {
            id: loc.id,
            name: loc.name,
            address: loc.address,
            coord: { 
              latitude: parseFloat(loc.latitude), 
              longitude: parseFloat(loc.longitude) 
            },
            need: isHigh ? 'High' : (isMedium ? 'Medium' : 'Low'),
            topNeeds: demands.map((d: any) => d.category_name).slice(0, 3)
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
    Linking.openURL(`maps://?daddr=${coord.latitude},${coord.longitude}&dirflg=d`);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center' }}>
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
        <View style={{ borderRadius: 24, overflow: "hidden", height: 450, borderWidth: 1, borderColor: '#1a1a1a' }}>
          <MapView
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
                <View style={[styles.pin, { backgroundColor: NEED_COLORS[loc.need] }]}>
                  <View style={styles.pinDot} />
                </View>
                <Callout tooltip onPress={() => openDirections(loc.coord)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{loc.name}</Text>
                    <Text style={styles.calloutAddress}>{loc.address}</Text>
                    
                    <Text style={styles.calloutLabel}>URGENT NEEDS</Text>
                    {loc.topNeeds.length > 0 ? loc.topNeeds.map((n: string, index: number) => (
                      /* FIXED KEY HERE */
                      <Text key={`${loc.id}-${index}`} style={styles.calloutNeed}>• {n}</Text>
                    )) : <Text style={styles.calloutNeed}>General Donations</Text>}
                    
                    <Text style={styles.calloutDirections}>Tap for Directions →</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: "#888", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  h1: { color: "#fff", fontSize: 32, fontWeight: "800", marginBottom: 6 },
  sub: { color: "#888", fontSize: 14 },
  pin: { width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: "#0a0a0a", alignItems: "center", justifyContent: "center" },
  pinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "white" },
  callout: { backgroundColor: "#1a1a1a", padding: 14, borderRadius: 14, minWidth: 220, borderWidth: 1, borderColor: "#2a2a2a" },
  calloutTitle: { color: "#fff", fontWeight: "800", fontSize: 16, marginBottom: 2 },
  calloutAddress: { color: "#888", fontSize: 12 },
  calloutLabel: { color: "#666", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginTop: 10, marginBottom: 4 },
  calloutNeed: { color: "#ddd", fontSize: 13, marginBottom: 2 },
  calloutDirections: { color: "#4CAF50", fontWeight: "800", marginTop: 12, fontSize: 14 },
});

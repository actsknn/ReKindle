import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* 1. Dashboard Placeholder */}
      <View style={styles.dashboardCard}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.statsText}>You have 150 GoodCycle Points</Text>
      </View>

      {/* 2. The Big Scan Button */}
      <TouchableOpacity 
        style={styles.bigScanButton}
        onPress={() => router.push('/camera')} // Triggers the full-screen camera
        activeOpacity={0.8}
      >
        <View style={styles.buttonInner}>
          <Ionicons name="camera" size={50} color="#ffffff" />
          <Text style={styles.buttonText}>SCAN ITEM</Text>
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
  // --- The Big Button Styles ---
  bigScanButton: {
    position: 'absolute',
    bottom: 40, // Keeps it floating above the tab bar
    backgroundColor: '#4CAF50', // GoodCycle Green
    width: 160,
    height: 160,
    borderRadius: 80, // Makes it a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
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
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  }
});

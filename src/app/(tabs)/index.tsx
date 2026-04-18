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
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  dashboardCard: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
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
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 6,
    borderColor: '#E8F5E9',
  },
  buttonInner: {
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  }
});
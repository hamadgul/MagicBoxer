import React from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import { Button } from "native-base";
import {
  FontAwesome,
  MaterialIcons,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AppLink from "react-native-app-link";

const GettingStartedPage = ({ navigation }) => {
  // Function to handle opening the Measure app directly for iOS
  const openMeasureApp = () => {
    const measureAppUrl = "measure://"; // Replace with the correct deep link if known

    AppLink.maybeOpenURL(measureAppUrl, {
      appName: "Measure",
      appStoreId: "1383426740", // App Store ID for the Measure app
      appStoreLocale: "us", // Locale can be adjusted based on the App Store location
      playStoreId: "", // Leave empty as the Measure app is iOS only
    }).catch((err) => {
      Alert.alert("Error", "Unable to open the Measure app.");
      console.error("Error opening Measure app: ", err);
    });
  };

  // Function to handle opening the Ruler app for Android
  const openGoogleRulerApp = () => {
    const playStoreId = "org.nixgame.ruler"; // Ruler app Play Store ID
    AppLink.maybeOpenURL(
      "https://play.google.com/store/apps/details?id=" + playStoreId,
      {
        appName: "Ruler",
        playStoreId,
      }
    ).catch((err) => {
      Alert.alert("Error", "Unable to open the Ruler app.");
      console.error("Error opening Ruler app: ", err);
    });
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContent}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../assets/images/icon_2.png')}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.welcomeTitle}>
              Welcome to{'\n'}
              <Text style={styles.brandName}>MagicBoxer</Text>
            </Text>
          </View>
        </View>

        {/* How MagicBoxer Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>
            Smart shipping, simplified
          </Text>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="cube-outline" size={28} color="#3B82F6" />
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Enter Your Items</Text>
              <Text style={styles.stepDescription}>
                Add items with dimensions or use our AI-powered lookup to find them instantly.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="content-save-outline" size={28} color="#3B82F6" />
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Save Your Package</Text>
              <Text style={styles.stepDescription}>
                Save your package or let MagicBoxer optimize the arrangement for you.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="cube" size={28} color="#3B82F6" />
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Visualize in 3D</Text>
              <Text style={styles.stepDescription}>
                See your package in 3D and get the optimal box size for your carrier.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <MaterialCommunityIcons name="airplane" size={28} color="#3B82F6" />
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Compare Shipping Rates</Text>
              <Text style={styles.stepDescription}>
                Compare real-time shipping rates from all major carriers.
              </Text>
            </View>
          </View>
        </View>

        {/* Measurement Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Measurement Guide</Text>
          <View style={styles.stepContainer}>
            <MaterialIcons name="straighten" size={24} color="#3B82F6" />
            <Text style={styles.stepText}>
              Measure <Text style={styles.boldText}>Length</Text> (longest side),{" "}
              <Text style={styles.boldText}>Width</Text> (second longest), and{" "}
              <Text style={styles.boldText}>Height</Text> in inches.
            </Text>
          </View>

          {/* iOS Users */}
          <View style={[styles.section, { 
            backgroundColor: '#F8FAFC',
            marginTop: 16,
            marginBottom: 0,
            shadowOpacity: 0
          }]}>
            <View style={styles.stepContainer}>
              <AntDesign name="apple1" size={24} color="#3B82F6" />
              <Text style={styles.stepText}>
                <Text style={styles.boldText}>iOS Users:</Text> Use the built-in Measure app
              </Text>
            </View>
            <Button style={styles.measureApp} onPress={openMeasureApp}>
              <Text style={styles.measureButtonText}>Measure App</Text>
            </Button>
          </View>

          {/* Android Users */}
          <View style={[styles.section, { 
            backgroundColor: '#F8FAFC',
            marginTop: 16,
            marginBottom: 0,
            shadowOpacity: 0
          }]}>
            <View style={styles.stepContainer}>
              <AntDesign name="android1" size={24} color="#3B82F6" />
              <Text style={styles.stepText}>
                <Text style={styles.boldText}>Android Users:</Text> Get the Ruler app
              </Text>
            </View>
            <Button style={styles.measureApp} onPress={openGoogleRulerApp}>
              <Text style={styles.measureButtonText}>Ruler App</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.centeredButtonContainer}>
        <Button
          style={styles.proceedButton}
          onPress={() => navigation.navigate("Create Package")}
        >
          <Text style={styles.proceedButtonText}>Let's Get Started</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  welcomeContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 85,
    height: 85,
    borderRadius: 22,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  appIcon: {
    width: '100%',
    height: '100%',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    lineHeight: 34,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#64748B', // Changed to match the side menu header color for consistency
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3B82F6",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  sectionSubText: {
    fontSize: 16,
    color: "#4A5568",
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletContainer: {
    marginTop: 8,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
    width: '100%',
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: 15,
    color: "#4A5568",
    lineHeight: 22,
    marginLeft: 8,
    flex: 0,
  },
  boldText: {
    fontWeight: "600",
    color: "#2D3748",
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingRight: 8,
  },
  stepText: {
    fontSize: 15,
    color: "#4A5568",
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  measureApp: {
    backgroundColor: "#64748B",
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 12,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  measureButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  centeredButtonContainer: {
    padding: 16,
    paddingBottom: 32, // Increased bottom padding
    backgroundColor: "#F5F7FA",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  proceedButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  // How MagicBoxer Works styles

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 8,
  },

  sectionSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepNumber: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 22,
    overflow: 'hidden',
  },
  stepTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  }
});

export default GettingStartedPage;
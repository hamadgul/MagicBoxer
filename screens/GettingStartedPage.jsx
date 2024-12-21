import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Keyboard,
  Image,
} from "react-native";
import { Button } from "native-base";
import {
  FontAwesome,
  MaterialIcons,
  Entypo,
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
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContent}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../assets/images/icon.png')}
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

        {/* Features Section */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionHeader}>
            Smart Features
          </Text>
          <Text style={styles.sectionSubText}>
            Take the guesswork out of shipping with our intelligent packing solutions.
          </Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint}>
              <FontAwesome name="magic" size={20} color="#3B82F6" />
              <Text style={[styles.label, { marginLeft: 8 }]}>
                Smart Packing Algorithm
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons name="cube-outline" size={20} color="#3B82F6" />
              <Text style={[styles.label, { marginLeft: 8 }]}>
                3D Packing Preview
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons name="cash" size={20} color="#3B82F6" />
              <Text style={[styles.label, { marginLeft: 8 }]}>
                Cost Optimization
              </Text>
            </View>
          </View>
        </View>

        {/* Perfect For Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Perfect For</Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons name="truck-delivery" size={20} color="#3B82F6" />
              <Text style={[styles.label, { marginLeft: 8 }]}>
                Movers
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons name="shopping" size={20} color="#3B82F6" />
              <Text style={[styles.label, { marginLeft: 8 }]}>
                Online Sellers
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <MaterialCommunityIcons name="gift" size={20} color="#3B82F6" />
              <Text style={[styles.label, { marginLeft: 8 }]}>
                Gift Senders
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
              <Text style={styles.measureButtonText}>Open Measure App</Text>
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
              <Text style={styles.measureButtonText}>Download Ruler App</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.centeredButtonContainer}>
        <Button
          style={styles.proceedButton}
          onPress={() => navigation.navigate("FormPage")}
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
    paddingVertical: 24,
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
    color: '#3B82F6',
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
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 12,
    shadowColor: "#3B82F6",
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
  }
});

export default GettingStartedPage;
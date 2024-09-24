import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { Button } from "native-base";
import {
  FontAwesome,
  MaterialIcons,
  Entypo,
  AntDesign,
} from "@expo/vector-icons";
import { Linking } from "react-native";

const GettingStartedPage = ({ navigation }) => {
  // Function to handle opening the Measure app
  const openMeasureApp = () => {
    const measureAppUrl = "https://apps.apple.com/us/app/measure/id1383426740"; // App Store link for Measure app

    Linking.openURL(measureAppUrl).catch((err) => {
      Alert.alert("Error", "Unable to open the Measure app.");
      console.error("Error opening Measure app: ", err);
    });
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Content Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Unique Features of MagicBoxer
          </Text>
          <Text style={styles.sectionSubText}>
            MagicBoxer simplifies packing, helping you choose the perfect box,
            optimize space, and save on shipping costs with these unique
            features:
          </Text>

          <View style={{ height: 10 }} />

          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint}>
              <FontAwesome name="gears" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Smart Packing Algorithm:</Text>{" "}
                Automatically finds the best box for your items, maximizing
                space and minimizing hassle.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <MaterialIcons name="view-in-ar" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>
                  Interactive 3D Packing Visuals:
                </Text>{" "}
                Get a 360-degree view of exactly how to pack your items,
                ensuring everything fits perfectly.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Entypo name="price-tag" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Shipping Cost Comparisons:</Text>{" "}
                Compare prices across top shipping carriers to find the best and
                most cost-effective option for your needs.
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Who is This App For?</Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint}>
              <AntDesign name="checkcircle" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Movers:</Text> Pack efficiently
                and make the most of your space.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <AntDesign name="checkcircle" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Frequent Shippers:</Text> Find the
                right box and the cheapest carrier for your items.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <AntDesign name="checkcircle" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Casual Shippers:</Text> Send gifts
                to family and friends without the packing hassle.
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            How to Measure Your Items in Inches
          </Text>
          <View style={styles.stepContainer}>
            <AntDesign name="infocirlce" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              Use a tape measure or ruler marked in inches to measure the{" "}
              <Text style={styles.boldText}>Length</Text>,{" "}
              <Text style={styles.boldText}>Width</Text>, and{" "}
              <Text style={styles.boldText}>Height</Text> of your item.
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <AntDesign name="arrowright" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Length</Text>: Measure the longest
              side of the item.
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <AntDesign name="arrowright" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Width</Text>: Measure the side
              perpendicular to the length.
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <AntDesign name="arrowright" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Height</Text>: Measure from the base
              to the top of the item.
            </Text>
          </View>
        </View>

        {/* Section 4: Using the Apple Measure App */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Using the Apple Measure App</Text>
          <Text style={styles.sectionText}>
            If you have an iPhone, you can use the built-in Measure app to get
            accurate measurements of your items. Follow these steps:
          </Text>

          <View style={{ height: 10 }} />

          <View style={styles.stepContainer}>
            <AntDesign name="mobile1" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Step 1</Text>: Open the Measure app
              on your iPhone.
            </Text>
          </View>

          <View style={styles.stepContainer}>
            <AntDesign name="scan1" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Step 2</Text>: Move your iPhone
              around to calibrate it. You’ll see a white dot on the screen once
              it’s ready.
            </Text>
          </View>

          <View style={styles.stepContainer}>
            <AntDesign name="arrowsalt" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Step 3</Text>: Align the white dot
              with one end of the item and tap the{" "}
              <Text style={styles.boldText}>+</Text> button to start measuring.
            </Text>
          </View>

          <View style={styles.stepContainer}>
            <AntDesign name="arrowsalt" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Step 4</Text>: Move the iPhone
              slowly to the other end of the item and tap the{" "}
              <Text style={styles.boldText}>+</Text> button again to complete
              the measurement.
            </Text>
          </View>

          <View style={styles.stepContainer}>
            <AntDesign name="camera" size={24} color="#1C6EA4" />
            <Text style={styles.stepText}>
              <Text style={styles.boldText}>Step 5</Text>: Repeat the process
              for measuring the Width and Height. You can also take a screenshot
              for reference.
            </Text>
          </View>

          <Button style={styles.measureApp} onPress={openMeasureApp}>
            <Text style={styles.measureButtonText}>Open Measure App</Text>
          </Button>
        </View>
      </ScrollView>

      {/* Button to Proceed */}
      <View style={styles.centeredButtonContainer}>
        <Button
          style={styles.proceedButton}
          onPress={() => navigation.navigate("FormPage")}
        >
          <Text style={styles.proceedButtonText}>Start Adding Items</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fdfdfd",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fdfdfd",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  bulletContainer: {
    marginBottom: 10,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 10,
    flex: 1,
  },
  sectionSubText: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  boldText: {
    fontWeight: "bold",
  },
  centeredButtonContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  proceedButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  measureApp: {
    backgroundColor: "#1C6EA4",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  measureButtonText: {
    color: "#fff",
    fontWeight: "bold",
    alignItems: "center",
  },
});

export default GettingStartedPage;

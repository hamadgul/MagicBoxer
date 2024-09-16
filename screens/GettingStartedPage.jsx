import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { Button } from "native-base";
import AntDesign from "@expo/vector-icons/AntDesign";

const GettingStartedPage = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Getting Started: Measure Your Items</Text>

      {/* Section 1: Introduction */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>
          Why Measuring Accurately is Important
        </Text>
        <Text style={styles.sectionText}>
          Properly measuring your items ensures they fit into the optimal box
          size, saving you costs and reducing waste. Follow these steps to
          measure your items accurately in inches.
        </Text>
      </View>

      {/* Section 2: Manual Measurement Instructions */}
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

      {/* Section 3: Using the Apple Measure App */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Using the Apple Measure App</Text>
        <Text style={styles.sectionText}>
          If you have an iPhone, you can use the built-in Measure app to get
          accurate measurements of your items. Follow these steps:
        </Text>

        <View style={styles.stepContainer}>
          <AntDesign name="mobile1" size={24} color="#1C6EA4" />
          <Text style={styles.stepText}>
            <Text style={styles.boldText}>Step 1</Text>: Open the Measure app on
            your iPhone.
          </Text>
        </View>

        <View style={styles.stepContainer}>
          <AntDesign name="scan1" size={24} color="#1C6EA4" />
          <Text style={styles.stepText}>
            <Text style={styles.boldText}>Step 2</Text>: Move your iPhone around
            to calibrate it. You’ll see a white dot on the screen once it’s
            ready.
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
            <Text style={styles.boldText}>Step 4</Text>: Move the iPhone slowly
            to the other end of the item and tap the{" "}
            <Text style={styles.boldText}>+</Text> button again to complete the
            measurement.
          </Text>
        </View>

        <View style={styles.stepContainer}>
          <AntDesign name="camera" size={24} color="#1C6EA4" />
          <Text style={styles.stepText}>
            <Text style={styles.boldText}>Step 5</Text>: Repeat the process for
            measuring the Width and Height. You can also take a screenshot for
            reference.
          </Text>
        </View>
      </View>

      {/* Button to Proceed */}
      <View style={styles.buttonContainer}>
        <Button
          style={styles.proceedButton}
          onPress={() => navigation.navigate("FormPage")}
        >
          <Text style={styles.proceedButtonText}>Start Adding Items</Text>
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C6EA4",
    textAlign: "center",
    marginBottom: 20,
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
  sectionText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
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
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  imageCaption: {
    textAlign: "center",
    fontSize: 14,
    color: "#888",
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  proceedButton: {
    backgroundColor: "#1C6EA4",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  proceedButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default GettingStartedPage;

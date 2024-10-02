import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { carrierBoxes } from "../packing_algo/packing";

const CarrierBoxListPage = () => {
  // List of carriers
  const carriers = ["USPS", "FedEx", "UPS", "No Carrier"];

  // Function to round dimension values down to the nearest 20th
  const roundToTwentieth = (value) => Math.floor(value * 20) / 20;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Carrier Box Sizes and Pricing</Text>

      <Text style={styles.introText}>
        Here is a list of standard box sizes for each carrier. Prices are
        estimates (box only) and box dimensions are derived from the carrier
        websites.
      </Text>

      {carriers.map((carrier) => {
        const boxes = carrierBoxes(carrier); // Get box data for the carrier

        return (
          <View key={carrier} style={styles.carrierSection}>
            <Text style={styles.sectionHeader}>{carrier}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text
                    style={[
                      styles.tableHeader,
                      styles.cell,
                      styles.cellBorder,
                      { width: 250 }, // Increased width for Box Type
                    ]}
                  >
                    Box Type
                  </Text>
                  <Text
                    style={[
                      styles.tableHeader,
                      styles.cell,
                      styles.cellBorder,
                      { width: 180 }, // Increased width for Dimensions
                    ]}
                  >
                    Dimensions (in)
                  </Text>
                  <Text
                    style={[
                      styles.tableHeader,
                      styles.cell,
                      styles.cellBorder,
                      { width: 100 }, // Increased width for Price
                    ]}
                  >
                    Price
                  </Text>
                </View>

                {/* Table Rows */}
                {boxes.map((box, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text
                      style={[styles.cell, styles.cellBorder, { width: 250 }]}
                      numberOfLines={3} // Allowing more lines for text wrapping
                      ellipsizeMode="tail"
                    >
                      {box[5]}
                    </Text>
                    <Text
                      style={[styles.cell, styles.cellBorder, { width: 180 }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {roundToTwentieth(box[0])} x {roundToTwentieth(box[1])} x{" "}
                      {roundToTwentieth(box[2])}
                    </Text>
                    <Text
                      style={[styles.cell, styles.cellBorder, { width: 100 }]}
                    >
                      {box[3] === 0
                        ? "Free with service"
                        : `$${box[3].toFixed(2)}`}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        );
      })}
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
  introText: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
  carrierSection: {
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
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableHeaderRow: {
    backgroundColor: "#f1f1f1",
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
    paddingVertical: 8,
  },
  cell: {
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: "center",
    flexWrap: "wrap",
  },
  cellBorder: {
    borderWidth: 1,
    borderColor: "#ccc",
  },
});

export default CarrierBoxListPage;

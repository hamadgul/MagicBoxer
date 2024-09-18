import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { carrierBoxes } from "./packing"; // Import carrier boxes from packing.js

const CarrierBoxListPage = () => {
  // List of carriers
  const carriers = ["USPS", "FedEx", "UPS", "No Carrier"];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Carrier Box Sizes and Pricing</Text>

      <Text style={styles.introText}>
        Here is a list of standard box sizes for each carrier. Prices are
        estimates and box dimensions are derived from the carrier websites.
      </Text>

      {carriers.map((carrier) => {
        const boxes = carrierBoxes(carrier); // Get box data for the carrier

        return (
          <View key={carrier} style={styles.carrierSection}>
            <Text style={styles.sectionHeader}>{carrier}</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <Text style={styles.tableHeader}>Box Type</Text>
                <Text style={styles.tableHeader}>Dimensions (in)</Text>
                <Text style={styles.tableHeader}>Price</Text>
              </View>

              {/* Table Rows */}
              {boxes.map((box, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{box[5]}</Text>
                  <Text style={styles.tableCell}>
                    {box[0]} x {box[1]} x {box[2]}
                  </Text>
                  <Text style={styles.tableCell}>
                    {box[3] === 0 ? "N/A" : `$${box[3].toFixed(2)}`}
                  </Text>
                </View>
              ))}
            </View>
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
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  tableCell: {
    fontSize: 16,
    color: "#333",
  },
});

export default CarrierBoxListPage;

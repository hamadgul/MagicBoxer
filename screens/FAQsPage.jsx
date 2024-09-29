import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";

const FAQsPage = ({ navigation }) => {
  const faqs = [
    {
      question: "How should I measure an item that can be folded?",
      answer: "Measure it in the folded state, as you plan to pack it.",
    },
    {
      question: "How can I see a 360° view of the box and items?",
      answer:
        "Use finger gestures to rotate around the box. Use the slider to remove items and view the box and items from all angles.",
    },
    {
      question: "Where do the box sizes come from?",
      answer:
        "Box sizes are standard sizes from each carrier. There are custom sizes not available in the app.",
      redirectText: "See available box sizes here.",
      redirectPage: "Box Sizes Used",
    },
    {
      question: "What items is this app best for?",
      answer:
        "Most items! However, it's not ideal for small documents or papers.",
    },
    {
      question: "Are the displayed prices for shipping or the box?",
      answer:
        'Prices are for the box only. Free boxes are only free with shipping from the respective carrier. Use the "no carrier" option to view box prices without shipping.',
    },
    {
      question:
        "How do multiple quantities of the same item appear in the 3D view?",
      answer:
        'In the legend, multiple quantities of an item (e.g., "Charger") will be labeled as Charger2, Charger3, etc.',
    },
    {
      question: "What is your privacy policy?",
      answer: "View our privacy policy here.",
      redirectText: "Privacy Policy",
      redirectPage: "Privacy Policy",
    },
    {
      question: "How do I delete or rename a package?",
      answer:
        "Long press the package on the Saved Packages page to get options to rename or delete it.",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Frequently Asked Questions</Text>
      {faqs.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <Text style={styles.question}>{faq.question}</Text>
          <Text style={styles.answer}>{faq.answer}</Text>
          {faq.redirectText && (
            <TouchableOpacity
              onPress={() => navigation.navigate(faq.redirectPage)}
              style={styles.redirectLink}
            >
              <Text style={styles.redirectText}>{faq.redirectText}</Text>
              <AntDesign name="arrowright" size={16} color="#007BFF" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F7F7F7",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  answer: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  redirectLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  redirectText: {
    fontSize: 16,
    color: "#007BFF",
    marginRight: 5,
  },
});

export default FAQsPage;

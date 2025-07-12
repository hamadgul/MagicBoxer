import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AntDesign, Ionicons } from "@expo/vector-icons";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQsPage = ({ navigation }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <Ionicons name="help-circle" size={40} color="#FFFFFF" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Help Center</Text>
        <Text style={styles.headerSubtitle}>Find answers to common questions about SmartBox AI</Text>
        <View style={styles.headerDivider} />
        <Text style={styles.headerVersion}>Version 1.2.0 • July 2025</Text>
      </View>
    </View>
  );

  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How should I measure item dimensions correctly?",
      answer: "MagicBoxer uses a standardized approach: Length is the longest side, Width is the second longest side, and Height is the shortest side. Look for the information icon (ⓘ) next to the Length field in the Create Package form for a visual guide.",
      icon: "ruler-outline"
    },
    {
      question: "Can't find the dimensions for an item?",
      answer: "Use our AI-powered dimension lookup! When searching for an item in the Saved Items page with no results, click 'Search with AI'. You can also access this feature directly from the navigation menu.",
      redirectText: "Try the AI Lookup feature",
      redirectPage: "LookupItemPage",
      icon: "flash-outline"
    },
    {
      question: "How can I see a 360° view of the box and items?",
      answer: "Use finger gestures to rotate around the box. Use the slider to remove items and view the box and items from all angles. The 3D view now has improved scaling for all device sizes.",
      icon: "sync"
    },
    {
      question: "How do I save items for future use?",
      answer: "After entering item dimensions, tap 'Add to Container'. Then tap 'Save Package' and give your package a name. All items in that package will be saved individually and available in the 'Saved Items' section for future use.",
      icon: "bookmark-outline"
    },
    {
      question: "Where do the box sizes come from?",
      answer: "Box sizes are standard sizes from each carrier. There are custom sizes not available in the app.",
      redirectText: "See available box sizes here.",
      redirectPage: "Box Sizes Used",
      icon: "cube"
    },
    {
      question: "What happens if I try to leave the form with unsaved items?",
      answer: "The app will detect this and show a confirmation dialog with options to save your work, discard changes, or cancel navigation. This prevents accidental data loss.",
      icon: "alert-circle-outline"
    },
    {
      question: "Are the displayed prices for shipping or the box?",
      answer: "Prices are for box only for the 'No Carrier' option. For other carriers, the price is for shipping with the box included. The only exception is FedEx, where the price is for shipping without the box & for UPS 'Ground' estimates. UPS Ground Advantage includes the box in the estimate.",
      redirectText: "See shipping estimates here.",
      icon: "pricetag"
    },
    {
      question: "How do multiple quantities of the same item appear in the 3D view?",
      answer: "In the legend, multiple quantities of an item (e.g., 'Charger') will be labeled as Charger, Charger 2, Charger 3, etc.",
      icon: "copy"
    },
    {
      question: "How do I delete or rename a package?",
      answer: "Long press the package on the Saved Packages page to get options to rename or delete it. You can also select multiple packages by entering selection mode.",
      icon: "create"
    },
    {
      question: "Can I import or export my saved items?",
      answer: "Yes! On the Saved Items page, use the floating action button (+ icon) to access import and export options. This allows you to back up your data or transfer it between devices.",
      icon: "swap-horizontal-outline"
    },
    {
      question: "What is your privacy policy?",
      answer: "View our privacy policy here.",
      redirectText: "Privacy Policy",
      redirectPage: "Privacy Policy",
      icon: "shield-checkmark"
    },
    {
      question: "Where can I report a bug or request a feature?",
      answer: "Please visit our request form to submit any bugs or feature requests. Your feedback is valuable to us!",
      redirectText: "Go to the request form.",
      redirectPage: "RequestFormPage",
      icon: "bug"
    },
  ];

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView}>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.faqItem,
              expandedIndex === index && styles.faqItemExpanded
            ]}
            onPress={() => toggleExpand(index)}
            activeOpacity={0.7}
          >
            <View style={styles.questionRow}>
              <Ionicons name={faq.icon} size={24} color="#3B82F6" style={styles.icon} />
              <Text style={styles.question}>{faq.question}</Text>
              <AntDesign
                name={expandedIndex === index ? "minus" : "plus"}
                size={20}
                color="#3B82F6"
              />
            </View>
            
            {expandedIndex === index && (
              <View style={styles.answerContainer}>
                <Text style={styles.answer}>{faq.answer}</Text>
                {faq.redirectText && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate(faq.redirectPage)}
                    style={styles.redirectLink}
                  >
                    <Text style={styles.redirectText}>{faq.redirectText}</Text>
                    <AntDesign name="arrowright" size={16} color="#3B82F6" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // iOS system background color
  },
  headerContainer: {
    backgroundColor: '#007AFF', // iOS blue
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  headerDivider: {
    height: 1,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 12,
  },
  headerVersion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  scrollView: {
    padding: 16,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: Platform.OS === 'ios' ? 0 : 1, // No border on iOS
    borderColor: "#EDF2F7",
  },
  faqItemExpanded: {
    backgroundColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    marginRight: 12,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    lineHeight: 24,
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
  },
  answer: {
    fontSize: 15,
    color: "#4A5568",
    lineHeight: 22,
  },
  redirectLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  redirectText: {
    color: "#007AFF", // iOS blue
    fontSize: 15,
    fontWeight: "500",
    marginRight: 6,
  },
});

export default FAQsPage;

import React from "react";
import { View, Text, StyleSheet, ScrollView, Button } from "react-native"; // Updated import statement
import { AntDesign } from "@expo/vector-icons";

const PrivacyPolicyPage = ({ navigation }) => {
  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Privacy Policy Header */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Privacy Policy</Text>
          <Text style={styles.sectionSubText}>Last Updated: [09/26/2024]</Text>
        </View>

        {/* Introduction Section */}
        <View style={styles.section}>
          <Text style={styles.sectionText}>
            Welcome to MagicBoxer! Your privacy is important to us. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information when you use our application, MagicBoxer. Please read
            this Privacy Policy carefully. By using MagicBoxer, you agree to the
            collection and use of information in accordance with this policy.
          </Text>
        </View>

        {/* Information Collection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            MagicBoxer does not collect or store any personal information you
            submit while using the app. The app processes data locally on your
            device and does not send, save, or share any of the data you input.
          </Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint}>
              <AntDesign name="infocirlce" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Usage Data:</Text> We may collect
                anonymous usage data such as app performance metrics and crash
                reports to help us improve the app experience. This data does
                not include any personally identifiable information.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <AntDesign name="infocirlce" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Device Information:</Text>{" "}
                Information about your device, such as model, operating system,
                and app version, may be collected for diagnostic and performance
                purposes.
              </Text>
            </View>
          </View>
        </View>

        {/* Usage of Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            2. How We Use Your Information
          </Text>
          <Text style={styles.sectionText}>
            Given that MagicBoxer does not store any of your input data, the
            limited information we collect is used solely to:
          </Text>
          <View style={styles.bulletContainer}>
            <View style={styles.bulletPoint}>
              <AntDesign name="checkcircle" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                Improve app performance and user experience.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <AntDesign name="checkcircle" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                Diagnose and fix technical issues.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <AntDesign name="checkcircle" size={20} color="#1C6EA4" />
              <Text style={styles.bulletText}>
                Analyze app usage patterns to enhance features.
              </Text>
            </View>
          </View>
        </View>

        {/* Sharing Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>3. Sharing Your Information</Text>
          <Text style={styles.sectionText}>
            Since we do not store any user-submitted information, there is no
            personal data to share with third parties. We may share anonymized,
            non-identifiable performance metrics with service providers who help
            us analyze app performance.
          </Text>
        </View>

        {/* Data Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>4. Data Security</Text>
          <Text style={styles.sectionText}>
            We are committed to protecting your information. However, because
            MagicBoxer processes everything locally on your device and does not
            transmit or store any personal data, your information remains
            private and secure.
          </Text>
        </View>

        {/* Privacy Rights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>5. Your Privacy Rights</Text>
          <Text style={styles.sectionText}>
            As we do not collect or store personal data, there is no personal
            information for you to access, update, or delete. Your interactions
            with MagicBoxer are entirely contained within your device.
          </Text>
        </View>

        {/* Third-Party Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>6. Third-Party Links</Text>
          <Text style={styles.sectionText}>
            MagicBoxer may contain links to other websites or services that are
            not operated by us. If you click on a third-party link, you will be
            directed to that third party's site. We strongly advise you to
            review the Privacy Policy of every site you visit, as we have no
            control over and assume no responsibility for their content, privacy
            policies, or practices.
          </Text>
        </View>

        {/* Changes to Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            7. Changes to This Privacy Policy
          </Text>
          <Text style={styles.sectionText}>
            We may update our Privacy Policy from time to time. Any changes will
            be posted on this page with an updated “Last Updated” date. You are
            advised to review this Privacy Policy periodically for any changes.
          </Text>
        </View>

        {/* Contact Us Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>8. Contact Us</Text>
          <Text style={styles.sectionText}>
            If you have any questions or concerns about this Privacy Policy,
            please contact us at:
          </Text>
          <Text style={styles.sectionText}>
            - **Email**: [Your Email Address]
          </Text>
          <Text style={styles.sectionText}>
            - **Address**: [Your Company Address]
          </Text>
        </View>
      </ScrollView>
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
  sectionText: {
    fontSize: 16,
    color: "#555",
    marginTop: 10,
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
  boldText: {
    fontWeight: "bold",
  },
  centeredButtonContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default PrivacyPolicyPage;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as MailComposer from 'expo-mail-composer';

const RequestFormPage = () => {
  const [topic, setTopic] = useState('');
  const [email, setEmail] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  const handleSubmit = async () => {
    if (!topic || !email || !issueDescription) {
      Alert.alert('Missing Fields', 'Please fill out all the fields before submitting.');
      return;
    }

    const message = `Topic: ${topic}\nEmail: ${email}\nDescription: ${issueDescription}`;
    try {
      await MailComposer.composeAsync({
        recipients: ['smartboxai@gmail.com'],
        subject: 'Bug/Feature Request',
        body: message,
      });
      Alert.alert('Request Sent!', 'Thank you for your feedback.');
      setTopic('');
      setEmail('');
      setIssueDescription('');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled" // Allow scrolling and dismissing the keyboard
      >
        <Text style={styles.title}>Bug/Feature Request</Text>
        <Text style={styles.subtitle}>We value your feedback!</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Topic"
            placeholderTextColor="#aaa"
            value={topic}
            onChangeText={setTopic}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Your Email"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue..."
            placeholderTextColor="#aaa"
            value={issueDescription}
            onChangeText={setIssueDescription}
            multiline
            textAlignVertical="top"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            !topic || !email || !issueDescription ? styles.buttonDisabled : {},
          ]}
          onPress={handleSubmit}
          disabled={!topic || !email || !issueDescription}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
    justifyContent: 'flex-start', // Align everything towards the top
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 20, // Add space from the very top
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default RequestFormPage;

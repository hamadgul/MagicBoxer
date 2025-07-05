import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo?.componentStack);
    
    this.setState({
      errorInfo
    });
    
    // You could also log the error to an error reporting service here
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. Please try again.
          </Text>
          
          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {this.state.error?.toString()}
            </Text>
            <Text style={styles.stackTrace}>
              {this.state.errorInfo?.componentStack}
            </Text>
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={this.resetError}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#343a40',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#f1f3f5',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#dc3545',
    fontWeight: '500',
    marginBottom: 10,
  },
  stackTrace: {
    color: '#6c757d',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;

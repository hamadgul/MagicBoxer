import React, { Component } from 'react';
import { Button, Alert } from 'react-native';
import { AppRegistry, Text, View, StyleSheet, Image, TextInput } from 'react-native';
import AppNavigator from '../navigation/AppNavigator';
import { WebBrowser } from 'expo';

export default class LoginScreen extends React.Component {
  render() {
    const { navigate } = this.props.navigation;

    return (
      <View style = {styles.main}>
        <View style = {styles.container}>
          <View>
            <Image source = {require('../assets/images/big_logo.png')}
                   style = {styles.image}
                   resizeMode = 'cover' />
          </View>
          <View style = {styles.space}></View>
           <TextInput style = {styles.input}
              placeholder = "Username"
              value="test.123"
            />
          <TextInput style = {styles.input}
              placeholder = "Password"
              secureTextEntry = {true}
              value="test123"
          />
          <View style = {styles.space}></View>
          <View style = {styles.buttonStyle}>
            <Button
              onPress={() => navigate("Details")}
              title= 'Log In'
              color = '#FFFFFF'
              accessibilityLabel ="Log in using OAuth"
            />
          </View>
        </View>
      </View>
    )
  }
};

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center'
  },
  main: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  input: {
    height: 50,
    width: 250,
    marginTop: 30,
    borderRadius: 20,
    padding: 10,
    fontSize: 18,
    borderWidth: 2,
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowRadius: 10,
    shadowOpacity: 0.25
  },
  buttonStyle: {
    backgroundColor: '#102e44',
    borderRadius: 10,
    width: 250,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowRadius: 10,
    shadowOpacity: 0.25
  },
  space: {
    padding: 15
  }
});

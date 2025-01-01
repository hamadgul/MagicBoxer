import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

// Import screens, make sure paths are correct
import GettingStartedPage from "../screens/GettingStartedPage";
import FormPage from "../screens/FormPage";
import CarrierBoxListPage from "../screens/CarrierBoxListPage";
import Display3D from "../screens/Display3D";
import TestDisplay3D from "../screens/TestDisplay3D";
import PrivacyPolicyPage from "../screens/PrivacyPolicyPage";
import PackagesPage from "../screens/PackagesPage";
import FAQsPage from "../screens/FAQsPage";
import ShipPackagePage from "../screens/ShipPackagePage";
import RequestFormPage from "../screens/RequestFormPage";
import TestPage from "../screens/TestPage";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Drawer navigator to handle side menu for specific pages
function DrawerNavigator() {
  return (
    <Drawer.Navigator 
      drawerPosition="right"
      screenOptions={{
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#64748B',
        headerStyle: {
          backgroundColor: '#fff'
        },
        headerTitleStyle: {
          color: '#0f2d44'
        }
      }}
    >
      <Drawer.Screen
        name="Getting Started"
        component={GettingStartedPage}
        options={{ 
          drawerLabel: "Getting Started",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="rocket-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="FormPage"
        component={FormPage}
        options={{ 
          drawerLabel: "Items to Pack", 
          title: "Add Items!",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="Saved Packages"
        component={PackagesPage}
        options={{ 
          drawerLabel: "Saved Packages",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="Test Boxes"
        component={TestPage}
        options={{ 
          drawerLabel: "Test Boxes",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="Help"
        component={FAQsPage}
        options={{ 
          drawerLabel: "Help",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  );
}

// Stack navigator to handle overall navigation, including Display3D
function AppNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Drawer">
          <Stack.Screen
            name="Add Items"
            component={DrawerNavigator}
            options={{ headerShown: false, title: "Add Items" }} // Hide header for drawer pages
          />
          <Stack.Screen
            name="Display3D"
            component={Display3D}
            options={{
              title: "Optimal Box Size",
              headerShown: true, // Show stack header with back button
              gestureEnabled: true, // Enable gestures for back navigation
            }}
          />
          <Stack.Screen
            name="TestDisplay3D"
            component={TestDisplay3D}
            options={{
              title: "Box Visualization",
              headerShown: true,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="Shipping Estimate"
            component={ShipPackagePage}
            options={{
              title: "Shipping Estimate",
              headerShown: true,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="Privacy Policy"
            component={PrivacyPolicyPage}
            options={{
              headerShown: true, // Show stack header with back button
              gestureEnabled: true, // Enable gestures for back navigation
              headerBackTitle: "Help",
            }}
            // Enable gestures for back navigation
          />
          <Stack.Screen
            name="RequestFormPage"
            component={RequestFormPage}
            options={{
              headerShown: true, // Show stack header with back button
              gestureEnabled: true, // Enable gestures for back navigation
              headerBackTitle: "Help",
            }}
            // Enable gestures for back navigation
          />
          <Stack.Screen
            name="Box Sizes Used"
            component={CarrierBoxListPage}
            options={{
              title: "Box Sizes in-App",
              headerShown: true, // Show stack header with back button
              gestureEnabled: true, // Enable gestures for back navigation
              headerBackTitle: "Help",
            }}
            // Enable gestures for back navigation
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default AppNavigator;
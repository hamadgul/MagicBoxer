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
import PrivacyPolicyPage from "../screens/PrivacyPolicyPage";
import PackagesPage from "../screens/PackagesPage";
import FAQsPage from "../screens/FAQsPage";

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
              title: "Pack my Items!",
              headerShown: true, // Show stack header with back button
              gestureEnabled: true, // Enable gestures for back navigation
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
import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

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
import BoxCustomizer from "../screens/BoxCustomizer";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Drawer navigator to handle side menu for specific pages
function DrawerNavigator() {
  const headerWithIcon = (iconName, title) => ({
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{title}</Text>
        <Ionicons name={iconName} size={24} color="white" style={{ marginLeft: 10 }} />
      </View>
    ),
    headerRight: () => null, // Remove default right button
  });

  return (
    <Drawer.Navigator 
      drawerPosition="right"
      screenOptions={{
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#64748B',
        headerStyle: {
          backgroundColor: '#3B82F6'
        },
        headerTitleStyle: {
          color: 'white'
        },
        headerTintColor: 'white',
        headerTitleAlign: 'center'
      }}
    >
      <Drawer.Screen
        name="Getting Started"
        component={GettingStartedPage}
        options={{ 
          ...headerWithIcon('rocket-outline', 'Getting Started'),
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
          ...headerWithIcon('add-circle-outline', 'Add Items'),
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
          ...headerWithIcon('archive-outline', 'Saved Packages'),
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
          ...headerWithIcon('construct-outline', 'Test Boxes'),
          drawerLabel: "Test Boxes",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="Box Customizer"
        component={BoxCustomizer}
        options={{ 
          ...headerWithIcon('cube-outline', 'Box Customizer'),
          drawerLabel: "Box Customizer",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="Help"
        component={FAQsPage}
        options={{ 
          ...headerWithIcon('help-circle-outline', 'Help'),
          drawerLabel: "Help",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="RequestFormPage"
        component={RequestFormPage}
        options={{
          ...headerWithIcon('mail-outline', 'Contact Us'),
          drawerLabel: "Contact Us",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="mail-outline" size={size} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  );
}

// Stack navigator to handle overall navigation, including Display3D
function AppNavigator() {
  const headerWithIcon = (iconName, title) => ({
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{title}</Text>
        <Ionicons name={iconName} size={24} color="white" style={{ marginLeft: 10 }} />
      </View>
    ),
    headerRight: () => null, // Remove default right button
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#3B82F6',
            },
            headerTitleStyle: {
              color: 'white',
            },
            headerTintColor: 'white',
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen
            name="Add Items"
            component={DrawerNavigator}
            options={{
              headerShown: false
            }}
          />
          <Stack.Screen
            name="Display3D"
            component={Display3D}
            options={{
              ...headerWithIcon('cube', 'Optimal Box Size'),
              headerShown: true,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="TestDisplay3D"
            component={TestDisplay3D}
            options={{
              ...headerWithIcon('cube', 'Box Visualization'),
              headerShown: true,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="Box Customizer"
            component={BoxCustomizer}
            options={{
              ...headerWithIcon('cube-outline', 'Box Customizer'),
              headerShown: true,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="Shipping Estimate"
            component={ShipPackagePage}
            options={{
              ...headerWithIcon('airplane-outline', 'Shipping Estimate'),
              headerShown: true,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="Privacy Policy"
            component={PrivacyPolicyPage}
            options={{
              ...headerWithIcon('shield-checkmark-outline', 'Privacy Policy'),
              headerShown: true,
              gestureEnabled: true,
              headerBackTitle: "Help",
            }}
          />
          <Stack.Screen
            name="RequestFormPage"
            component={RequestFormPage}
            options={{
              ...headerWithIcon('mail-outline', 'Contact Us'),
              headerShown: true,
              gestureEnabled: true,
              headerBackTitle: "Help",
            }}
          />
          <Stack.Screen
            name="Box Sizes Used"
            component={CarrierBoxListPage}
            options={{
              ...headerWithIcon('cube-outline', 'Box Sizes in-App'),
              headerShown: true,
              gestureEnabled: true,
              headerBackTitle: "Help",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default AppNavigator;
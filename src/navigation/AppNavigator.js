import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { DEV_BUILD_APP } from "../config/environment";



// Import the SmartBox AI icon without background
import SmartBoxAIIcon from "../assets/images/icon_nobg.png";

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

import SavedItemsPage from "../screens/SavedItemsPage";
import LookupItemPage from "../screens/LookupItemPage";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tab navigator for modern navigation
function BottomTabNavigator() {
  const headerWithIcon = (iconName, title) => ({
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={iconName} size={24} color="#3B82F6" style={{ marginRight: 10 }} />
        <Text style={{ color: '#64748B', fontSize: 18, fontWeight: '600' }}>{title}</Text>
      </View>
    ),
    headerRight: () => null,
  });

  // Main tab screens - only the most important ones for bottom navigation
  const mainTabScreens = [
    {
      name: "Create Package",
      component: FormPage,
      options: {
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="cube-outline" size={24} color="#3B82F6" style={{ marginRight: 10 }} />
            <Text style={{ color: '#64748B', fontSize: 18, fontWeight: '600' }}>Create Package</Text>
          </View>
        ),
        headerRight: () => null,
        tabBarLabel: "Create",
        title: "Create Package",
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name="cube-outline" size={size} color={color} />
        )
      }
    },
    {
      name: "Saved Packages",
      component: PackagesPage,
      options: {
        ...headerWithIcon('archive-outline', 'Saved Packages'),
        tabBarLabel: "Packages",
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name="archive-outline" size={size} color={color} />
        )
      }
    },
    {
      name: "My Saved Items",
      component: SavedItemsPage,
      options: {
        ...headerWithIcon('bookmark-outline', 'My Saved Items'),
        tabBarLabel: "Items",
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name="bookmark-outline" size={size} color={color} />
        )
      }
    },
    {
      name: "Help",
      component: FAQsPage,
      options: {
        ...headerWithIcon('help-circle-outline', 'Help'),
        tabBarLabel: "Help",
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons name="help-circle-outline" size={size} color={color} />
        )
      }
    }
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 20, // Increased bottom padding for safe area
          paddingTop: 8,
          height: 85, // Increased height to accommodate safe area
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#E2E8F0',
        },
        headerTitleStyle: {
          color: '#64748B',
        },
        headerTintColor: '#64748B',
        headerTitleAlign: 'center',
      }}
    >
      {mainTabScreens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Tab.Navigator>
  );
}

// Stack navigator to handle overall navigation, including Display3D
function AppNavigator() {
  const headerWithIcon = (iconName, title) => ({
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={iconName} size={24} color="#64748B" style={{ marginRight: 10 }} />
        <Text style={{ color: '#64748B', fontSize: 18, fontWeight: '600' }}>{title}</Text>
      </View>
    ),
    headerRight: () => null, // Remove default right button
  });

  const screens = [
    {
      name: "Add Items",
      component: BottomTabNavigator,
      options: {
        headerShown: false
      }
    },
    {
      name: "AI Item Search",
      component: LookupItemPage,
      options: ({ navigation, route }) => {
        // Create a custom header configuration based on navigation source
        const fromFormPage = route.params?.fromFormPage;
        
        return {
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="search-outline" size={24} color="#3B82F6" style={{ marginRight: 10 }} />
              <Text style={{ color: '#64748B', fontSize: 18, fontWeight: '600' }}>AI Item Search</Text>
            </View>
          ),
          // Only show back button if coming from FormPage
          headerLeft: fromFormPage ? () => (
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => {
                // Navigate back to the FormPage
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#64748B" />
            </TouchableOpacity>
          ) : undefined, // Use undefined to get default drawer menu button when not from FormPage
          headerShown: true,
          gestureEnabled: true,
        };
      }
    },
    {
      name: "Display3D",
      component: Display3D,
      options: {
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ marginRight: 10 }}>
              <MaterialCommunityIcons name="cube" size={28} color="#3B82F6" />
            </View>
            <Text style={{ color: '#64748B', fontSize: 18, fontWeight: '600' }}>Optimal Box Size</Text>
          </View>
        ),
        headerRight: () => null,
        headerShown: true,
        gestureEnabled: true,
      }
    },
    {
      name: "TestDisplay3D",
      component: TestDisplay3D,
      options: {
        ...headerWithIcon('cube-outline', 'Box Visualization'),
        headerShown: true,
        gestureEnabled: true,
      }
    },

    {
      name: "Shipping Estimate",
      component: ShipPackagePage,
      options: {
        ...headerWithIcon('airplane-outline', 'Shipping Estimate'),
        headerShown: true,
        gestureEnabled: true,
      }
    },
    {
      name: "Privacy Policy",
      component: PrivacyPolicyPage,
      options: {
        ...headerWithIcon('shield-checkmark-outline', 'Privacy Policy'),
        headerShown: true,
        gestureEnabled: true,
        headerBackTitle: "Help",
      }
    },
    {
      name: "RequestFormPage",
      component: RequestFormPage,
      options: {
        ...headerWithIcon('mail-outline', 'Contact Us'),
        headerShown: true,
        gestureEnabled: true,
        headerBackTitle: "Help",
      }
    },
    {
      name: "Box Sizes Used",
      component: CarrierBoxListPage,
      options: {
        ...headerWithIcon('cube-outline', 'Box Sizes in-App'),
        headerShown: true,
        gestureEnabled: true,
        headerBackTitle: "Help",
      }
    }
  ];

  // Add additional screens that are accessible via navigation but not in bottom tabs
  screens.push(
    {
      name: "Getting Started",
      component: GettingStartedPage,
      options: {
        ...headerWithIcon('rocket-outline', 'Getting Started'),
        headerShown: true,
        gestureEnabled: true,
      }
    }
  );

  // Add test screens only in development
  if (DEV_BUILD_APP) {
    screens.push(
      {
        name: "Test Boxes",
        component: TestPage,
        options: {
          ...headerWithIcon('construct-outline', 'Test Boxes'),
          headerShown: true,
          gestureEnabled: true,
        }
      },

    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E2E8F0',
        },
        headerTitleStyle: {
          color: '#64748B',
        },
        headerTintColor: '#64748B',
        headerTitleAlign: 'center',

      }}
    >
      {screens.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Stack.Navigator>
  );
}



export default AppNavigator;
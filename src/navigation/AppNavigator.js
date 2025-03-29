import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { DEV_BUILD_APP } from "../config/environment";

// Import the MagicBoxer icon without background
import MagicBoxerIcon from "../assets/images/icon_nobg.png";

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
const Drawer = createDrawerNavigator();

// Custom drawer content component for a more professional look
function CustomDrawerContent(props) {
  return (
    <View style={styles.drawerContainer}>
      {/* Header with logo and app name */}
      <View style={styles.drawerHeader}>
        <View style={styles.safeAreaPadding} />
        <View style={styles.logoContainer}>
          <Image source={MagicBoxerIcon} style={styles.logoImage} />
          <Text style={styles.logoText}>MagicBoxer</Text>
        </View>
        <View style={styles.divider} />
      </View>
      
      {/* Main content with scrolling menu items */}
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.drawerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      
      {/* Footer with version info */}
      <View style={styles.drawerFooter}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

// Drawer navigator to handle side menu for specific pages
function DrawerNavigator() {
  const headerWithIcon = (iconName, title) => ({
    headerTitle: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={iconName} size={24} color="#3B82F6" style={{ marginRight: 10 }} />
        <Text style={{ color: '#64748B', fontSize: 18, fontWeight: '600' }}>{title}</Text>
      </View>
    ),
    headerRight: () => null, // Remove default right button
  });

  const screens = [
    {
      name: "Getting Started",
      component: GettingStartedPage,
      options: {
        ...headerWithIcon('rocket-outline', 'Getting Started'),
        drawerLabel: "Getting Started",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="rocket-outline" size={size} color={color} />
        )
      }
    },
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
        drawerLabel: "Create Package",
        title: "Create Package",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="cube-outline" size={size} color={color} />
        )
      }
    },
    {
      name: "Saved Packages",
      component: PackagesPage,
      options: {
        ...headerWithIcon('archive-outline', 'Saved Packages'),
        drawerLabel: "Saved Packages",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="archive-outline" size={size} color={color} />
        )
      }
    },
    {
      name: "My Saved Items",
      component: SavedItemsPage,
      options: {
        ...headerWithIcon('bookmark-outline', 'My Saved Items'),
        drawerLabel: "My Saved Items",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="bookmark-outline" size={size} color={color} />
        )
      }
    },
    {
      name: "Lookup Item Dims",
      component: LookupItemPage,
      options: {
        ...headerWithIcon('search-outline', 'Lookup Item Dims'),
        drawerLabel: "Lookup Item Dims",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="search-outline" size={size} color={color} />
        )
      }
    },

    {
      name: "Help",
      component: FAQsPage,
      options: {
        ...headerWithIcon('help-circle-outline', 'Help'),
        drawerLabel: "Help",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="help-circle-outline" size={size} color={color} />
        )
      }
    },
    {
      name: "RequestFormPage",
      component: RequestFormPage,
      options: {
        ...headerWithIcon('mail-outline', 'Contact Us'),
        drawerLabel: "Contact Us",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="mail-outline" size={size} color={color} />
        )
      }
    }
  ];

  // Add test screens only in development
  if (DEV_BUILD_APP) {
    screens.push(
      {
        name: "Test Boxes",
        component: TestPage,
        options: {
          ...headerWithIcon('construct-outline', 'Test Boxes'),
          drawerLabel: "Test Boxes",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          )
        }
      },

      {
        name: "Test Display3D",
        component: TestDisplay3D,
        options: {
          ...headerWithIcon('cube-outline', 'Test Display3D'),
          drawerLabel: "Test Display3D",
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          )
        }
      }
    );
  }

  return (
    <Drawer.Navigator 
      drawerPosition="right"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: '#64748B', // Changed to match modal header gray
        drawerInactiveTintColor: '#94A3B8', // Lighter gray for inactive items
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
          marginLeft: -4, // Adjusted to prevent overlap with icons
        },
        drawerItemStyle: {
          borderRadius: 8,
          paddingVertical: 2,
          marginVertical: 2,
        },
        headerStyle: {
          backgroundColor: '#E2E8F0' // Updated to match the item card background color
        },
        headerTitleStyle: {
          color: '#64748B' // Updated to match the item name text color
        },
        headerTintColor: '#64748B', // Updated to match the item name text color
        headerTitleAlign: 'center',
        drawerStyle: {
          width: '68%', // Make drawer slightly narrower
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 15,
          borderBottomLeftRadius: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5
        }
      }}
    >
      {screens.map((screen) => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Drawer.Navigator>
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
      component: DrawerNavigator,
      options: {
        headerShown: false
      }
    },
    {
      name: "Display3D",
      component: Display3D,
      options: {
        ...headerWithIcon('cube-outline', 'Optimal Box Size'),
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

// Styles for the custom drawer
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    backgroundColor: '#FFFFFF',
  },
  safeAreaPadding: {
    height: 30, // Adjust based on device
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18, // Increased vertical padding
  },
  logoImage: {
    width: 50, // Increased logo size
    height: 50, // Increased logo size
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 22, // Increased font size
    fontWeight: '600',
    marginLeft: 8, // Slightly increased spacing
    color: '#64748B', // Changed to match the active drawer item color for consistency
    letterSpacing: 0.3, // Slight letter spacing for a more premium look
  },
  divider: {
    height: 1.5, // Slightly thicker divider
    backgroundColor: '#E2E8F0',
    marginBottom: 8, // Slightly increased spacing after divider
  },
  drawerScrollContent: {
    paddingTop: 0,
  },
  menuContainer: {
    paddingHorizontal: 0, // Remove horizontal padding to give more space
    paddingTop: 4,
  },
  drawerFooter: {
    padding: 12,
    paddingBottom: 25, // Extra padding at the bottom for iPhone
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 'auto', // Push to bottom of container
  },
  versionText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AppNavigator;
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
import BoxCustomizer from "../screens/BoxCustomizer"; 
//import TestProduct from "../screens/TestProduct";
import SavedItemsPage from "../screens/SavedItemsPage";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Custom drawer content component for a more professional look
function CustomDrawerContent(props) {
  return (
    <View style={styles.drawerContainer}>
      {/* Use a separate SafeAreaView with forceInset for the header to handle iPhone notches properly */}
      <View style={styles.drawerHeader}>
        <View style={styles.safeAreaPadding} />
        <View style={styles.logoContainer}>
          <Image source={MagicBoxerIcon} style={styles.logoImage} />
          <Text style={styles.logoText}>MagicBoxer</Text>
        </View>
        <View style={styles.divider} />
      </View>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScrollContent}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
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
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{title}</Text>
        <Ionicons name={iconName} size={24} color="white" style={{ marginLeft: 10 }} />
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
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Create Package</Text>
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
      name: "Box Customizer",
      component: BoxCustomizer,
      options: {
        ...headerWithIcon('cube-outline', 'Box Customizer'),
        drawerLabel: "Box Customizer",
        drawerIcon: ({ focused, color, size }) => (
          <Ionicons name="cube-outline" size={size} color={color} />
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
        name: "Test products",
        component: TestProduct,
        options: {
          ...headerWithIcon('construct-outline', 'Test Products'),
          drawerLabel: "Test Products",
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
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#64748B',
        headerStyle: {
          backgroundColor: '#3B82F6'
        },
        headerTitleStyle: {
          color: 'white'
        },
        headerTintColor: 'white',
        headerTitleAlign: 'center',
        drawerStyle: {
          width: '70%', // Make drawer narrower
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 15,
          borderBottomLeftRadius: 15,
          shadowColor: '#000',
          shadowOffset: { width: -2, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 5,
        },
        drawerItemStyle: {
          borderRadius: 8,
          paddingVertical: 4,
          marginVertical: 4,
          marginHorizontal: 10,
        },
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
        },
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
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{title}</Text>
        <Ionicons name={iconName} size={24} color="white" style={{ marginLeft: 10 }} />
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
        ...headerWithIcon('cube', 'Optimal Box Size'),
        headerShown: true,
        gestureEnabled: true,
      }
    },
    {
      name: "TestDisplay3D",
      component: TestDisplay3D,
      options: {
        ...headerWithIcon('cube', 'Box Visualization'),
        headerShown: true,
        gestureEnabled: true,
      }
    },
    {
      name: "Box Customizer",
      component: BoxCustomizer,
      options: {
        ...headerWithIcon('cube-outline', 'Box Customizer'),
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
      {
        name: "Test products",
        component: TestProduct,
        options: {
          ...headerWithIcon('construct-outline', 'Test Products'),
          headerShown: true,
          gestureEnabled: true,
        }
      }
    );
  }

  return (
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

// Styles for the custom drawer content
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF', // White background for better contrast
  },
  safeAreaPadding: {
    height: 50, // Safe area padding to avoid iPhone camera notch
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3B82F6', // Same blue as page headers
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 5,
    marginBottom: 0, // Reduced bottom margin to minimize white space
  },
  drawerScrollContent: {
    paddingTop: 0, // Reduced padding to minimize white space
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
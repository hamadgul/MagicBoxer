import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";
import { DEV_BUILD_APP } from "../config/environment";

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
import TestProduct from "../screens/TestProduct";

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
      name: "FormPage",
      component: FormPage,
      options: {
        ...headerWithIcon('add-circle-outline', 'Add Items'),
        drawerLabel: "Items to Pack",
        title: "Add Items!",
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
          {screens.map((screen) => (
            <Stack.Screen
              key={screen.name}
              name={screen.name}
              component={screen.component}
              options={screen.options}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default AppNavigator;
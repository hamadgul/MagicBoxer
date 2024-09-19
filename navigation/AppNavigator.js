// Updated AppNavigator.js

import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // Changed from createStackNavigator to createNativeStackNavigator
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import screens, make sure paths are correct
import GettingStartedPage from "../screens/GettingStartedPage";
import FormPage from "../screens/FormPage";
import CarrierBoxListPage from "../screens/CarrierBoxListPage";
import Display3D from "../screens/Display3D";

const Stack = createNativeStackNavigator(); // Changed from createStackNavigator to createNativeStackNavigator
const Drawer = createDrawerNavigator();

// Stack navigator component to handle stack navigation
function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="GettingStarted">
      <Stack.Screen
        name="GettingStarted"
        component={GettingStartedPage}
        options={{ title: "Getting Started" }}
      />
      <Stack.Screen
        name="FormPage"
        component={FormPage}
        options={{ title: "Items to Pack!" }}
      />
      <Stack.Screen
        name="Display3D"
        component={Display3D}
        options={{ title: "Pack my Items!" }}
      />
    </Stack.Navigator>
  );
}

// Drawer navigator for side menu navigation
function AppNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator initialRouteName="GettingStarted">
          <Drawer.Screen
            name="GettingStarted"
            component={GettingStartedPage}
            options={{ drawerLabel: "Getting Started" }}
          />
          <Drawer.Screen
            name="FormPage"
            component={FormPage}
            options={{ drawerLabel: "Items to Pack" }}
          />
          <Drawer.Screen
            name="CarrierBoxList"
            component={CarrierBoxListPage}
            options={{ drawerLabel: "Carrier Box Sizes" }}
          />
          <Drawer.Screen
            name="Display3D"
            component={Display3D}
            options={{ drawerLabel: "Pack my Items" }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default AppNavigator;

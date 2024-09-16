import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GettingStartedPage from "../screens/GettingStartedPage"; // Ensure path is correct
import FormPage from "../screens/FormPage"; // Ensure path is correct
import Display3D from "../screens/Display3D"; // Ensure path is correct

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="GettingStarted">
        {/* Ensure each screen is correctly defined */}
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
    </NavigationContainer>
  );
}

export default AppNavigator;

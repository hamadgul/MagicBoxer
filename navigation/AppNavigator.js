import React from "react";
import LoginScreen from "../screens/LoginScreen";
import FormPage from "../screens/FormPage";
import Display3D from "../screens/Display3D";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen name="Login Screen" component={LoginScreen} />
        <Stack.Screen name="Form Page" component={FormPage} />
        <Stack.Screen name="Display3D" component={Display3D} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;

import React from "react";
import LoginScreen from "../screens/LoginScreen";
import Details from "../screens/Details";
import Display from "../screens/Display";
import FormPage from "../screens/FormPage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen name="Login Screen" component={LoginScreen} />
        <Stack.Screen name="Form Page" component={FormPage} />
        <Stack.Screen name="Details" component={Details} />
        <Stack.Screen name="Display" component={Display} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

//<Stack.Screen name="LoginScreen" component={LoginScreen} />

export default AppNavigator;

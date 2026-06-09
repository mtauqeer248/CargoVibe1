import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RequestListScreen } from './src/screens/RequestListScreen';
import { RequestDetailScreen } from './src/screens/RequestDetailScreen';
import { RootStackParamList } from './src/types';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="RequestList"
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="RequestList"
          component={RequestListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RequestDetail"
          component={RequestDetailScreen}
          options={{
            title: 'Request Details',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

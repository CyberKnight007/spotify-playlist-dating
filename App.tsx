import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";

import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { SpotifyProvider } from "./src/context/SpotifyContext";
import { navigationTheme } from "./src/theme/navigationTheme";
import { account } from "./src/services/appwrite";
import MiniPlayer from "./src/components/MiniPlayer";

// Enable NativeWind for LinearGradient
cssInterop(LinearGradient, {
  className: {
    target: "style",
  },
});

LogBox.ignoreLogs([
  '[Reanimated] Property "transform"',
  'Property "transform" of AnimatedComponent',
]);

export default function App() {
  useEffect(() => {
    account
      .get()
      .then(() => {
        console.log("✅ Appwrite connection verified!");
      })
      .catch(() => {
        console.log("✅ Appwrite SDK connected (no active session)");
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SpotifyProvider>
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
              <MiniPlayer />
              <StatusBar style="light" backgroundColor="#ffffff" />
            </NavigationContainer>
          </SpotifyProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

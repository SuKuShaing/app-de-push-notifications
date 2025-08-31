import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function RootLayout() {
	const colorScheme = useColorScheme();
    const backgroundColor = useThemeColor({}, "background")
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	if (!loaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
			<Stack
				screenOptions={{
					headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: backgroundColor
                    }
				}}
            >
				<Stack.Screen name="index" options={{ title: "PushApp" }} />
			</Stack>
			{/* <StatusBar style="auto" /> */}
		</ThemeProvider>
	);
}

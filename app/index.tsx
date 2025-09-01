import { ThemedText } from "@/components/ThemedText";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import React from "react";
import { View } from "react-native";

const PushApp = () => {

    const { expoPushToken } = usePushNotifications();

	return (
		<View style={{
            marginHorizontal: 10,
            marginTop: 5
        }}>
			<ThemedText>Token: {expoPushToken}</ThemedText>
		</View>
	);
};

export default PushApp
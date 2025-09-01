import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Configuración de las notificaciones,
 * esta configuracion se hace una sola vez y se pasa al objeto
 */
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowList: true, // Mostrar la lista de notificaciones
		shouldPlaySound: true, // Reproducir sonido
		shouldSetBadge: true, // Mostrar el badge en la barra de notificaciones
		shouldShowBanner: true, // Mostrar la notificación en la barra de notificaciones
	}),
});

interface SendPushOptions {
	to: string[];
	title: string;
	body: string;
	data?: Record<string, any>;
}

/**
 * Función para enviar una notificación push
 * @param options - Objeto con la configuración de la notificación
 * @param options.to - Array de tokens de Expo Push, cada token representa un usuario
 * @param options.title - Título de la notificación
 * @param options.body - Cuerpo o contenido principal de la notificación
 * @param options.data - Datos adicionales opcionales (no visibles para el usuario)
 * @returns void
 */
async function sendPushNotification(options: SendPushOptions) {
	const { to, title, body, data } = options;

	const message = {
		to: to,
		sound: "default",
		title: title,
		body: body,
		data: data,
	};

	// URL de la API de Expo para enviar notificaciones push
	// a los usuarios que tengan el token de expo push
	await fetch("https://exp.host/--/api/v2/push/send", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Accept-encoding": "gzip, deflate",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(message),
	});
}

/**
 * Función para manejar errores de registro de notificaciones
 * @param errorMessage - Mensaje de error a mostrar
 * @returns void
 */
function handleRegistrationError(errorMessage: string) {
	alert(errorMessage);
	throw new Error(errorMessage);
}

/**
 * Función para registrar el token de expo push, en caso de que nos los otorguen
 * @returns string - Token de expo push
 */
async function registerForPushNotificationsAsync() {
	// Si es android, se configura el canal de notificaciones
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("default", {
			name: "default", // Nombre del canal de notificaciones
			importance: Notifications.AndroidImportance.MAX, // Importancia de la notificación
			vibrationPattern: [0, 250, 250, 250], // Patrón de vibración
			lightColor: "#FF231F7C", // Color de la luz
		});
	}

	// Si es dispositivo físico, se obtiene el token de expo push
	if (Device.isDevice) {
		const { status: existingStatus } =
			await Notifications.getPermissionsAsync(); // saber sí ya se tiene permiso para enviar notificaciones push

		let finalStatus = existingStatus; // status final de los permisos

		// si no se tiene permiso, se solicita
		if (existingStatus !== "granted") {
			// Importante, hay que avisar que vamos a pedir permiso para enviar notificaciones push
			// con una popup en la app, sí y solo sí el usuario acepta, se le pide el permiso
			const { status } = await Notifications.requestPermissionsAsync(); // se solicita el permiso para enviar notificaciones push
			finalStatus = status;
		}

		// si no se tiene permiso, nada que hacer, no se puede enviar notificaciones push
		if (finalStatus !== "granted") {
			handleRegistrationError(
				"Permission not granted to get push token for push notification!"
			);
			return;
		}

		// se obtiene el projectId de expo
		const projectId =
			Constants?.expoConfig?.extra?.eas?.projectId ??
			Constants?.easConfig?.projectId;
		if (!projectId) {
			handleRegistrationError("Project ID not found"); // si no se tiene el projectId, lanza un error
		}

		// sí tenemos acceso al token
		try {
			const pushTokenString = (
				await Notifications.getExpoPushTokenAsync({
					projectId,
				})
			).data;
			console.log({ [Platform.OS]: pushTokenString });
			return pushTokenString; // sí tenemos acceso al token, se retorna
		} catch (error: unknown) {
			handleRegistrationError(`${error}`);
		}
	} else {
		handleRegistrationError("Must use physical device for push notifications"); // si no es dispositivo físico, lanza un error
	}
}

let areListenersReady = false;
/**
 * usePushNotifications escucha las notificaciones entrantes y almacena en estado
 * maneja las respuestas de los usuarios a las notificaciones
 */
export const usePushNotifications = () => {
	const [expoPushToken, setExpoPushToken] = useState(""); // puede ser un useRef, pero al tener que mostrarlo en pantalla, se usa un useState
	const [notifications, setNotifications] = useState<
		Notifications.Notification[]
	>([]);

	useEffect(() => {
        if (areListenersReady) return; // sí ya se han añadido los listeners, no se vuelven a añadir, evita duplicados
		registerForPushNotificationsAsync() // se guarda el token de expo push
			.then((token) => setExpoPushToken(token ?? ""))
			.catch((error: any) => setExpoPushToken(`${error}`));
	}, []);

	useEffect(() => {
        if (areListenersReady) return; // sí ya se han añadido los listeners, no se vuelven a añadir, evita duplicados

        areListenersReady = true;

		const notificationListener = Notifications.addNotificationReceivedListener(  // añado el listener para recibir las notificaciones push
			(notification) => {
				setNotifications([notification, ...notifications]); // se agrega la notificación nueva al inicio de la lista
			}
		);

		const responseListener =
			Notifications.addNotificationResponseReceivedListener((response) => {
                /* escuchar cuando el usuario interactúa con una notificación push.
                el listener se activa cuando el usuario toca, desliza, presiona o interactúa con los botones de una notificación,
                */
				console.log(response);
			});

		return () => {
			notificationListener.remove(); // se remueve el listener para recibir las notificaciones push
			responseListener.remove();
		};
	}, []);

	return {
		// Properties
        expoPushToken,
        notifications,

		// Methods
        sendPushNotification,
	};
};

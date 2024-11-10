import { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native-gesture-handler';

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

export default function App() {
	const getDefaultTime = () => {
		const now = new Date();
		now.setMinutes(now.getMinutes() + 1);
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		return `${hours}:${minutes}`;
	};

	const [formData, setFormData] = useState({
		message: ' This is default notification message',
		time: getDefaultTime(),
	});

	const handleInputChange = (key: any, value: any) => {
		setFormData((prevData) => ({
			...prevData,
			[key]: value,
		}));
	};
	const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
		[]
	);
	const [notification, setNotification] = useState<
		Notifications.Notification | undefined
	>(undefined);
	const notificationListener = useRef<Notifications.Subscription>();
	const responseListener = useRef<Notifications.Subscription>();

	useEffect(() => {
		if (Platform.OS === 'android') {
			Notifications.getNotificationChannelsAsync().then((value) =>
				setChannels(value ?? [])
			);
		}
		notificationListener.current =
			Notifications.addNotificationReceivedListener((notification) => {
				setNotification(notification);
			});

		responseListener.current =
			Notifications.addNotificationResponseReceivedListener((response) => {
				console.log(response);
			});

		return () => {
			notificationListener.current &&
				Notifications.removeNotificationSubscription(
					notificationListener.current
				);
			responseListener.current &&
				Notifications.removeNotificationSubscription(responseListener.current);
		};
	}, []);

	const resetTime = () => {
		setFormData((prevData) => ({
			...prevData,
			time: getDefaultTime(),
		}));
	};

	const saveDataAndScheduleNotification = async () => {
		const { message, time } = formData;

		console.log(message, time);

		// Validate input
		if (!message || !time) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		try {
			// Save data to AsyncStorage
			await AsyncStorage.setItem('formData', JSON.stringify(formData));

			// Schedule notification
			const [hours, minutes] = time.split(':').map(Number);
			const notificationTime = new Date();
			notificationTime.setHours(hours);
			notificationTime.setMinutes(minutes);
			notificationTime.setSeconds(0);

			const triggerInSeconds = Math.floor(
				(notificationTime.getTime() - new Date().getTime()) / 1000
			);

			if (triggerInSeconds > 0) {
				await Notifications.scheduleNotificationAsync({
					content: {
						title: 'Scheduled Notification',
						body: message,
						sound: './assets/sounds/magic-notification-sound.wav',
						interruptionLevel: 'critical',
					},
					trigger: { seconds: triggerInSeconds },
				});
				Alert.alert(
					'Notification Scheduled',
					`Notification will be sent at ${time}`
				);
			} else {
				Alert.alert('Error', 'Time must be in the future');
			}
		} catch (error) {
			console.error('Error storing data or scheduling notification', error);
			Alert.alert('Error', 'An error occurred');
		}
	};

	return (
		<View
			style={{
				flex: 1,
				alignItems: 'center',
				justifyContent: 'space-around',
			}}
		>
			<Text style={{ color: 'red' }}>{`Channels: ${JSON.stringify(
				channels.map((c) => c.id),
				null,
				2
			)}`}</Text>
			<View style={{ alignItems: 'center', justifyContent: 'center' }}>
				<Text style={{ color: 'red' }}>
					Title: {notification && notification.request.content.title}{' '}
				</Text>
				<Text style={{ color: 'red' }}>
					Body: {notification && notification.request.content.body}
				</Text>
				<Text style={{ color: 'red' }}>
					Data:{' '}
					{notification && JSON.stringify(notification.request.content.data)}
				</Text>
			</View>
			<Button
				title="Press to schedule a notification"
				onPress={async () => {
					await schedulePushNotification();
				}}
			/>
			<View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
				<Text style={{ marginBottom: 10, color: 'red' }}>Enter Message:</Text>
				<TextInput
					style={{
						borderWidth: 1,
						borderColor: '#ccc',
						padding: 10,
						marginBottom: 20,
						borderRadius: 5,
						color: 'white',
					}}
					placeholder="Message"
					onChangeText={(text) => handleInputChange('message', text)}
					value={formData.message}
				/>

				<Text style={{ marginBottom: 10, color: 'red' }}>
					Enter Time (in HH:MM format):
				</Text>
				<TextInput
					style={{
						borderWidth: 1,
						borderColor: '#ccc',
						padding: 10,
						marginBottom: 20,
						borderRadius: 5,
						color: 'white',
					}}
					placeholder="Time (e.g., 15:30)"
					onChangeText={(text) => handleInputChange('time', text)}
					value={formData.time}
				/>

				<Button title="Submit" onPress={saveDataAndScheduleNotification} />
				<Button title="Reset" onPress={resetTime} />
			</View>
		</View>
	);
}

async function schedulePushNotification() {
	await Notifications.scheduleNotificationAsync({
		content: {
			title: "You've got message 📬",
			body: 'Here is the notification body',
			data: { data: 'goes here', test: { test1: 'more data' } },
			sound: './assets/sounds/magic-notification-sound.wav',
			interruptionLevel: 'critical',
		},
		trigger: { seconds: 5 },
	});
}

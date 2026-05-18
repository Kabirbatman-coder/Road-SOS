import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

export async function requestMotionAndLocationPermissions() {
  const accelerometerAvailable = await Accelerometer.isAvailableAsync();
  const gyroscopeAvailable = await Gyroscope.isAvailableAsync();
  const location = await Location.requestForegroundPermissionsAsync();

  const accelerometerPermission =
    typeof (Accelerometer as unknown as { requestPermissionsAsync?: () => Promise<unknown> })
      .requestPermissionsAsync === "function"
      ? await (Accelerometer as unknown as { requestPermissionsAsync: () => Promise<unknown> })
          .requestPermissionsAsync()
          .catch(() => null)
      : null;

  const gyroscopePermission =
    typeof (Gyroscope as unknown as { requestPermissionsAsync?: () => Promise<unknown> })
      .requestPermissionsAsync === "function"
      ? await (Gyroscope as unknown as { requestPermissionsAsync: () => Promise<unknown> })
          .requestPermissionsAsync()
          .catch(() => null)
      : null;

  return {
    accelerometerAvailable,
    gyroscopeAvailable,
    locationGranted: location.granted,
    accelerometerPermission,
    gyroscopePermission
  };
}

export async function getPermissionStatuses() {
  const [accelerometerAvailable, gyroscopeAvailable, location, notifications] = await Promise.all([
    Accelerometer.isAvailableAsync().catch(() => false),
    Gyroscope.isAvailableAsync().catch(() => false),
    Location.getForegroundPermissionsAsync().catch(() => null),
    Notifications.getPermissionsAsync().catch(() => null)
  ]);

  return {
    accelerometer: accelerometerAvailable ? "Available" : "Unavailable",
    gyroscope: gyroscopeAvailable ? "Available" : "Unavailable",
    location: location?.granted ? "Granted" : "Not granted",
    notifications: notifications?.granted ? "Granted" : "Not granted"
  };
}

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return current;
  }

  return Notifications.requestPermissionsAsync();
}

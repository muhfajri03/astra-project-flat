import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export async function tap(style = "light") {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if (navigator.vibrate) {
      navigator.vibrate(style === "medium" ? 18 : 8);
    }
  } catch {
    /* perangkat tanpa haptic */
  }
}

export async function success() {
  try {
    if (Capacitor.isNativePlatform()) await Haptics.notification({ type: NotificationType.Success });
    else if (navigator.vibrate) navigator.vibrate([12, 40, 12]);
  } catch {
    /* diabaikan */
  }
}

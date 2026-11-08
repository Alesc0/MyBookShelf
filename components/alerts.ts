import { Alert as NativeAlert, Platform } from "react-native";
// Native Alert has no web implementation. These dialogs are invoked only by user actions.
export const Alert: Pick<typeof NativeAlert, "alert"> = {
  alert(title, message, buttons, options) {
    if (Platform.OS !== "web")
      return NativeAlert.alert(title, message, buttons, options);
    const text = [title, message].filter(Boolean).join("\n\n");
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(text);
      const button = confirmed
        ? buttons.find((b) => b.style !== "cancel")
        : buttons.find((b) => b.style === "cancel");
      button?.onPress?.();
    } else {
      window.alert(text);
      buttons?.[0]?.onPress?.();
    }
  },
};

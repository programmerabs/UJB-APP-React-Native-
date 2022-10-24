import { Alert } from "react-native";

export async function fetchPublishableKey(paymentMethod) {
  try {
    const response = await fetch(
      `https://expo-stripe-server-example.glitch.me/stripe-key?paymentMethod=${paymentMethod}`
    );

    const { publishableKey } = await response.json();

    return publishableKey;
  } catch (e) {
    console.warn("Unable to fetch publishable key. Is your server running?");
    Alert.alert(
      "Error",
      "Unable to fetch publishable key. Is your server running?"
    );
    return null;
  }
}

// Must stay the first import: it installs globalThis.crypto.getRandomValues,
// which @katapatha/core/offline/ulid needs and neither react-native@0.87 nor
// expo@57 provides. Every StopEvent id comes from ulid().
import "@/platform/install-crypto";

import { Stack } from "expo-router";
import { color } from "@katapatha/tokens/tokens";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: color.navy },
        headerTintColor: color.surface,
        contentStyle: { backgroundColor: color.canvas },
      }}
    />
  );
}

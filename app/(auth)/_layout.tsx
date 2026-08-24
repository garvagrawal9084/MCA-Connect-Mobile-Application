import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 280,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          animation: "slide_from_right",
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </Stack>
  );
}

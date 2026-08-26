import { Stack } from "expo-router";

export default function AlumniLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="followlist" />
      <Stack.Screen name="mentors" />
      <Stack.Screen name="community" />
      <Stack.Screen name="companies" />
    </Stack>
  );
}

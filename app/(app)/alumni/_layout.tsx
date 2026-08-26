import { Stack } from "expo-router";

export default function AlumniLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Alumni Network" }} />
      <Stack.Screen name="directory" options={{ title: "Alumni Directory" }} />
      <Stack.Screen name="batches" options={{ title: "Batches" }} />
      <Stack.Screen name="events" options={{ title: "Events" }} />
      <Stack.Screen name="scis-family" options={{ title: "SCIS Family" }} />
      <Stack.Screen name="referral" options={{ title: "Referral Hub" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="followlist" options={{ title: "Follow List" }} />
      <Stack.Screen name="mentors" options={{ title: "Mentors" }} />
      <Stack.Screen name="community" options={{ title: "Forums" }} />
      <Stack.Screen name="topic" options={{ title: "Topic" }} />
      <Stack.Screen name="companies" options={{ title: "Companies" }} />
      <Stack.Screen name="support" options={{ title: "Support" }} />
      <Stack.Screen name="contact" options={{ title: "Contact Us" }} />
    </Stack>
  );
}

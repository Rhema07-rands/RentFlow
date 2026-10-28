import { Stack } from 'expo-router';

export default function ProfileRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }} />
  );
}

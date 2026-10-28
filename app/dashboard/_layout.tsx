import { Stack } from 'expo-router';

export default function DashboardRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="conversation/[id]" 
        options={{ 
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="property/[id]" 
        options={{ 
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="call/[id]" 
        options={{ 
          presentation: 'fullScreenModal',
          animation: 'fade',
        }} 
      />
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import { CallProvider } from '../contexts/CallContext';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { AlertProvider } from '../contexts/AlertContext';

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AlertProvider>
        <AuthProvider>
          <ChatProvider>
            <CallProvider>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }} />
            </CallProvider>
          </ChatProvider>
        </AuthProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}

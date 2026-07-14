import { Tabs } from 'expo-router';
import { Home, Pill, MessageSquare, Calendar, Bot, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0EA5E9',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontFamily: 'OutfitMedium',
          fontSize: 10,
          marginBottom: 4
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 64,
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          borderWidth: 1.5,
          borderColor: '#F1F5F9',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 8,
          paddingTop: 8,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          title: 'Meds',
          tabBarIcon: ({ color }) => <Pill color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageSquare color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => <Calendar color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'AI Bot',
          tabBarIcon: ({ color }) => <Bot color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}

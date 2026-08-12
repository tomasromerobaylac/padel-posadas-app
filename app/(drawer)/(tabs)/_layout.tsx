import { Tabs } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

function DrawerButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={{ paddingHorizontal: 16 }}
    >
      <Text style={{ fontSize: 20 }}>☰</Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true, headerLeft: () => <DrawerButton /> }}>
      <Tabs.Screen name="index" options={{ title: 'Partidos' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

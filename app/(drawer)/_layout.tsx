import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Inicio' }} />
      <Drawer.Screen name="friends" options={{ drawerLabel: 'Amigos', title: 'Amigos' }} />
    </Drawer>
  );
}

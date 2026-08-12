import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: '82%' },
        overlayColor: 'rgba(0,0,0,0.4)',
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Inicio' }} />
      <Drawer.Screen name="friends" options={{ drawerLabel: 'Amigos', title: 'Amigos', headerShown: true }} />
    </Drawer>
  );
}

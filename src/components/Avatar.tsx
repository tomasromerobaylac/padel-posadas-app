import { Image, StyleSheet, Text, View } from 'react-native';

export function Avatar({ name, photoUrl, size = 40 }: { name: string; photoUrl?: string; size?: number }) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={[styles.image, dimensionStyle]} />;
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.placeholder, dimensionStyle]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#eee' },
  placeholder: { backgroundColor: '#1b7f3a', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
});

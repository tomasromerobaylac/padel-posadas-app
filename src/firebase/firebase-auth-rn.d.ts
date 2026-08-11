// El SDK web de Firebase resuelve "firebase/auth" a su build específico de React Native
// en tiempo de bundling (Metro respeta la condición "react-native" del package.json de
// @firebase/auth), pero los tipos publicados bajo "firebase/auth" no incluyen ese export.
// Esta augmentation solo restaura el tipo para que tsc no falle; no cambia el runtime.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}

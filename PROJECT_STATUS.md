# Estado del proyecto — Pádel Posadas

Contexto para retomar el trabajo en una sesión nueva de Claude Code.

## Qué es

App móvil (React Native + Expo Router + Firebase) para organizar partidos y canchas
libres de pádel en Posadas, Misiones, reemplazando la coordinación manual por
WhatsApp. Ver el plan de producto original en el historial de commits (primer commit
grande) para el detalle de decisiones (categorías, modalidad individual/pareja, turnos
de duración fija, etc).

## Decisiones clave que hay que respetar

- **Todo tiene que ser gratis por ahora.** El usuario pidió explícitamente no pagar
  nada ni cargar tarjeta hasta que el proyecto sea sólido. Por eso:
  - El login es por **email + contraseña** (no por teléfono/SMS — Firebase Phone Auth
    requiere el plan pago Blaze). El teléfono queda como dato de perfil, no como
    credencial.
  - Los recordatorios de partido son **notificaciones push locales** (gratis, sin
    servidor), no WhatsApp.
  - Cuando el proyecto crezca, está pendiente migrar login y recordatorios a
    **WhatsApp Business API** (tarea en cola, requiere Meta Business API o Twilio,
    con costo).
- Roles (`player` / `club_owner` / `admin`) son **aditivos**: ser dueño de cancha o
  admin no saca las funciones de jugador, solo agrega pantallas extra.
- Los turnos son de duración fija (2hs partido / 1h clase, seleccionable), van de
  8:00 a 00:00.
- Agregar un amigo manda una **solicitud** que hay que aceptar, no agrega directo.

## Stack

- Expo SDK 54 (bajado de 57 por incompatibilidad con la versión de Expo Go del
  usuario), TypeScript, expo-router.
- Firebase: Auth (email/password), Firestore, reglas de seguridad por rol en
  `firestore.rules` (ya publicadas en la consola).
- Proyecto Firebase: `padel-posadas` (plan Spark, gratis).

## Cómo correr

```bash
npm install
npx expo start
```

Necesita un archivo `.env` (no está en git) con las credenciales de Firebase — pedírselo
al usuario o recuperarlo de la máquina donde se armó originalmente. Ver `.env.example`
para las claves necesarias.

Para probar en el celu con Expo Go: la compu y el celu tienen que estar en la misma
red Wi-Fi (`npx expo start`, modo LAN) o usar `npx expo start --tunnel` si hay
restricciones de red (ese modo necesita `@expo/ngrok`, ya está en devDependencies).

## Hecho

- Auth (email/password) + perfil (nombre, teléfono, categoría, género, clubes
  habituales).
- Feed de partidos abiertos y canchas libres (Home).
- Crear partido / publicar cancha libre, con selector turno-de-partido (2hs) vs
  clase (1h).
- Detalle de partido: unirse, compartir link (placeholder, ver pendientes), invitar
  amigos in-app.
- Amigos: agregar por teléfono manda solicitud, aceptar/rechazar, lista de amigos.
- Invitaciones a partidos: aparecen en Home con opción de unirse o rechazar.
- Recordatorios push locales (día antes y 2hs antes del partido).
- Panel de admin (`/admin`): aprobar/rechazar solicitudes de dueños de cancha,
  agregar clubes directo.
- Flujo "Sumar mi cancha" (`/club-owner-request`): cualquier usuario pide sumar su
  club, un admin lo revisa.
- Club de prueba cargado en Firestore: "Arena Padel Posadas".
- El usuario `tomasromerobaylac@gmail.com` tiene rol `admin` en Firestore.

## Pendiente (en orden de prioridad sugerido)

1. **Panel de dueño de cancha**: vista para `club_owner` — gestionar su club, ver
   turnos/reservas de su cancha.
2. **Chat entre jugador y dueño de cancha**: mensajería 1:1 asociada a una
   reserva/turno.
3. **Firebase Hosting** para el link de invitación (`padel-posadas.web.app`) — hoy
   es un placeholder que no resuelve a nada.
4. **Migrar OTP y recordatorios a WhatsApp Business API** cuando el proyecto sea
   más sólido (implica costo, requiere definir proveedor).
5. **Pasada de diseño/estética**: se dejó deliberadamente para el final, una vez que
   la estructura de pantallas esté estable. El usuario ya comentó que la UI actual
   es "muy plana".

## Cosas raras a tener en cuenta

- El editor de reglas de Firestore en la consola web es un CodeMirror que solo
  responde bien a inserción de texto plano vía automatización; teclas especiales
  (Backspace, Ctrl+A, flechas) no funcionan ahí. Si hay que tocar `firestore.rules`
  de nuevo a mano en la consola, es más fácil insertar bloques nuevos que borrar/
  reemplazar contenido existente.
- El proyecto vive dentro de `OneDrive\Desktop`, así que sincroniza solo entre
  máquinas con la misma cuenta de OneDrive — pero mejor usar el repo de GitHub
  (`https://github.com/tomasromerobaylac/padel-posadas-app`) como fuente de verdad,
  no depender de OneDrive para `node_modules`.

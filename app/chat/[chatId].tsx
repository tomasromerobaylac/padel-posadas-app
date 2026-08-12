import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { sendMessage, subscribeToMessages } from '../../src/data/chatRepo';
import type { ChatMessage } from '../../src/types/domain';

export default function ChatThreadScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { appUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, setMessages);
    return unsubscribe;
  }, [chatId]);

  async function handleSend() {
    if (!appUser || !text.trim()) return;
    const toSend = text.trim();
    setText('');
    await sendMessage(chatId, appUser.id, toSend);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === appUser?.id;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.text}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Todavía no hay mensajes. ¡Escribí el primero!</Text>}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribí un mensaje..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: 16, gap: 8 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6 },
  bubbleMine: { backgroundColor: '#1b7f3a', alignSelf: 'flex-end' },
  bubbleTheirs: { backgroundColor: '#fff', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#eee' },
  bubbleTextMine: { color: '#fff', fontSize: 15 },
  bubbleTextTheirs: { color: '#222', fontSize: 15 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendButton: { backgroundColor: '#1b7f3a', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendButtonText: { color: '#fff', fontWeight: '600' },
});

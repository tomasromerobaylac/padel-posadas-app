import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { ChatThreadView } from '../../src/components/ChatThreadView';
import { sendDirectMessage, subscribeToDirectMessages } from '../../src/data/directChatRepo';
import type { ChatMessage } from '../../src/types/domain';

export default function DirectChatThreadScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { appUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToDirectMessages(chatId, setMessages);
    return unsubscribe;
  }, [chatId]);

  return (
    <ChatThreadView
      messages={messages}
      currentUserId={appUser?.id}
      onSend={async (text) => {
        if (appUser) await sendDirectMessage(chatId, appUser.id, text);
      }}
    />
  );
}

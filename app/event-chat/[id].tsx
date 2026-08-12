import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { ChatThreadView } from '../../src/components/ChatThreadView';
import { sendEventMessage, subscribeToEventMessages } from '../../src/data/eventChatRepo';
import type { ChatMessage } from '../../src/types/domain';

export default function EventChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToEventMessages(id, setMessages);
    return unsubscribe;
  }, [id]);

  return (
    <ChatThreadView
      messages={messages}
      currentUserId={appUser?.id}
      onSend={async (text) => {
        if (appUser) await sendEventMessage(id, appUser.id, text);
      }}
    />
  );
}

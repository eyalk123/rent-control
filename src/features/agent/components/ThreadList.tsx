import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { ActivityIndicator, IconButton, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useLanguageContext } from '@/src/context';
import { EmptyState } from '@/src/shared/components/ui';
import { formatDateFull } from '@/src/shared/utils/dates';
import { deleteConversation, listConversations } from '../api/agentApi';
import { useAgentChat } from '../context/AgentChatContext';
import type { ConversationSummary } from '../types';

/** The conversation history list (its own screen). Tapping a thread loads it into the chat
 *  and returns to the Chat tab; the trailing button deletes it (with a confirm). */
export function ThreadList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language } = useLanguageContext();
  const { openThread, activeConversationId, newChat } = useAgentChat();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    setLoadError(false);
    listConversations()
      .then((c) => {
        if (alive) setItems(c);
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
        setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  const onPick = async (id: number) => {
    try {
      await openThread(id);
    } catch {
      // Stay put and say so — navigating back would drop the user into an unchanged chat.
      setLoadError(true);
      return;
    }
    router.back();
  };

  const onDelete = (id: number) => {
    Alert.alert(t('agent.delete'), t('agent.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('agent.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(id);
            if (id === activeConversationId) newChat();
            setItems((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
          } catch {
            /* leave the list as-is on failure */
          }
        },
      },
    ]);
  };

  if (items === null) return <ActivityIndicator style={{ marginTop: 24 }} />;
  if (loadError) {
    return (
      <EmptyState
        message={t('agent.errorGeneric')}
        icon="alert-circle"
        actionLabel={t('common.tryAgain')}
        onAction={load}
      />
    );
  }
  if (items.length === 0) {
    return <EmptyState message={t('agent.historyEmpty')} icon="message-square" />;
  }

  return (
    <ScrollView>
      {items.map((c) => (
        <List.Item
          key={c.id}
          title={c.title || t('agent.title')}
          description={formatDateFull(new Date(c.updated_at), language)}
          onPress={() => onPick(c.id)}
          right={(props) => (
            <IconButton
              {...props}
              icon="trash-can-outline"
              accessibilityLabel={t('agent.delete')}
              onPress={() => onDelete(c.id)}
            />
          )}
        />
      ))}
    </ScrollView>
  );
}

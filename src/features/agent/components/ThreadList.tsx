import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, IconButton, List, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useLanguageContext } from '@/src/context';
import { useAlert } from '@/src/core/context';
import { EmptyState } from '@/src/shared/components/ui';
import { formatDateFull } from '@/src/shared/utils/dates';
import { darkColors, lightColors } from '@/src/core/theme';
import { deleteConversation, listConversations } from '../api/agentApi';
import { useAgentChat } from '../context/AgentChatContext';
import type { ConversationSummary } from '../types';

/** The conversation history list (its own screen). Tapping a thread loads it into the chat
 *  and returns to the Chat tab; the trailing button deletes it (with a confirm). */
export function ThreadList() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const { appAlert } = useAlert();
  const { openThread, activeConversationId, newChat } = useAgentChat();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Navigating away mid-request must not set state on an unmounted screen.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const list = await listConversations();
      if (alive.current) setItems(list);
    } catch {
      if (!alive.current) return;
      setItems([]);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    if (alive.current) setRefreshing(false);
  }, [load]);

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
    // The app's own themed dialog, like every other confirm here. RN's Alert.alert draws the
    // platform dialog, which ignores the theme and stays LTR in Hebrew.
    appAlert(t('agent.delete'), t('agent.deleteConfirm'), [
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

  if (items === null) return <ActivityIndicator style={styles.loading} />;
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

  const activeBg = theme.dark ? 'rgba(194,149,67,0.15)' : 'rgba(212,162,76,0.12)';

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {items.map((c) => {
        // Coming back here from a thread gave no clue which one you were in.
        const isActive = c.id === activeConversationId;
        return (
          <List.Item
            key={c.id}
            title={c.title || t('agent.title')}
            description={formatDateFull(new Date(c.updated_at), language)}
            onPress={() => onPick(c.id)}
            accessibilityState={{ selected: isActive }}
            style={isActive ? { backgroundColor: activeBg } : undefined}
            titleStyle={isActive ? { color: colors.accent, fontWeight: '600' } : undefined}
            right={(props) => (
              <IconButton
                {...props}
                icon="trash-can-outline"
                accessibilityLabel={t('agent.delete')}
                // 48dp for real: Paper's default leaves the bounds at 40dp, which is what
                // accessibility services measure. Same treatment as the chat header buttons.
                style={[props.style, styles.delete]}
                onPress={() => onDelete(c.id)}
              />
            )}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 24,
  },
  delete: {
    width: 48,
    height: 48,
    marginHorizontal: 0,
    marginVertical: 0,
  },
});

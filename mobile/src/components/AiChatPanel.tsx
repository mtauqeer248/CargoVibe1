import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChatMessage, AiChatResponse, ParkingStatus } from '../types';
import { aiApi, ApiError } from '../api';
import { colors, spacing, radius, typography, shadows } from '../theme';

interface Props {
  onActionSuggested?: (action: AiChatResponse['suggestedAction']) => void;
}

export function AiChatPanel({ onActionSuggested }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat(text, history);
      const assistantMsg: ChatMessage = { role: 'assistant', content: res.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      setHistory(res.updatedHistory);

      if (res.suggestedAction && onActionSuggested) {
        onActionSuggested(res.suggestedAction);
      }
    } catch (err) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'AI assistant is not configured. An API key is required to enable this feature — please contact your administrator.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const SUGGESTIONS = [
    'How many requests are pending?',
    'Any tankers arriving today?',
    'Summarise the current status',
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.aiIcon}>
          <Text style={styles.aiIconText}>✦</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSub}>Ask anything about parking requests</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              AI assistant is available when an API key is configured. Ask questions like the examples below — responses require a valid Anthropic API key.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => { setInput(s); }}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                msg.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color={colors.ai} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about parking requests…"
          placeholderTextColor={colors.textMuted}
          multiline
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.aiBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIconText: {
    fontSize: 18,
    color: colors.ai,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestions: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  suggestionChip: {
    backgroundColor: colors.aiBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.ai + '30',
  },
  suggestionText: {
    ...typography.caption,
    color: colors.ai,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginVertical: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: radius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.aiBg,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  bubbleText: {
    lineHeight: 20,
  },
  userText: {
    ...typography.body,
    color: '#fff',
  },
  assistantText: {
    ...typography.body,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textMuted,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

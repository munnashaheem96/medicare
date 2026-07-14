import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../services/auth';
import { useData } from '../../services/data';
import { Send, MessageSquare, Info, ShieldAlert } from 'lucide-react-native';

export default function ChatScreen() {
  const { profile, user } = useAuth();
  const { sendMessage, useChatMessages } = useData();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  if (!profile || !user) return null;

  const doctorName = profile.doctor || 'Dr. Mehta (Cardiologist)';
  const messages = useChatMessages(doctorName);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    try {
      await sendMessage(doctorName, textToSend);
      // Wait for flatlist to re-render, then scroll to bottom (represented by index 0 since list is reversed)
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 100);
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.doctorName}>{doctorName}</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online / Response within hours</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Info color="#0EA5E9" size={16} style={{ marginRight: 8 }} />
        <Text style={styles.infoText}>
          You are messaging your primary doctor assigned by the hospital admin.
        </Text>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageSquare color="#94A3B8" size={48} />
            <Text style={styles.emptyTitle}>Start your conversation</Text>
            <Text style={styles.emptySubtitle}>
              Ask your doctor about symptoms, prescriptions, side effects, or request refills here.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isMe = item.senderId === user.uid;

              return (
                <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
                  <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    {!isMe && (
                      <Text style={styles.senderName}>{item.senderName}</Text>
                    )}
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message to your doctor..."
          placeholderTextColor="#94A3B8"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <Pressable style={styles.sendBtn} onPress={handleSend}>
          <Send color="#FFFFFF" size={20} />
        </Pressable>
      </View>
      {Platform.OS === 'ios' && <View style={{ height: 75 }} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  doctorName: {
    fontFamily: 'OutfitBold',
    fontSize: 20,
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontFamily: 'OutfitMedium',
    fontSize: 11,
    color: '#64748B',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesList: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 48 : 96,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  myBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  theirBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  myBubble: {
    backgroundColor: '#0EA5E9',
    borderBottomRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 0,
  },
  senderName: {
    fontFamily: 'OutfitBold',
    fontSize: 11,
    color: '#0EA5E9',
    marginBottom: 4,
  },
  messageText: {
    fontFamily: 'Outfit',
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#0F172A',
  },
  timeText: {
    fontFamily: 'Outfit',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimeText: {
    color: '#E0F2FE',
  },
  theirTimeText: {
    color: '#94A3B8',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderColor: '#F1F5F9',
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 100,
    marginRight: 12,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
});

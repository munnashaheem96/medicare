import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, Bot, MessageSquare, ShieldAlert } from 'lucide-react-native';

interface ChatbotMsg {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatbotMsg[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: 'welcome',
        text: 'Hello! I am your AI Health Assistant. How can I help you manage your medicines today? You can ask about side effects, missed doses, food instructions, or storage conditions.',
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const getBotResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('miss') || q.includes('forget') || q.includes('forgot')) {
      return 'If you miss a dose, take it as soon as you remember. However, if it is almost time for your next dose, skip the missed dose and resume your regular scheduling. Never take double doses to compensate!';
    }
    if (q.includes('food') || q.includes('eat') || q.includes('meal')) {
      return "Taking medicines 'Before Food' ensures optimal absorption in the stomach (usually 30-60 minutes before meals). 'After Food' helps protect your stomach lining from irritation (like aspirin or pain relievers). Please check your doctor's specific prescription label.";
    }
    if (q.includes('side effect') || q.includes('symptoms') || q.includes('harm')) {
      return 'Side effects vary per drug. Mild effects like nausea, dizziness, or sleepiness are common. If you experience severe rashes, swelling, or breathing difficulty, seek emergency medical care immediately and notify your doctor.';
    }
    if (q.includes('store') || q.includes('keep') || q.includes('fridge')) {
      return 'Most pills should be stored in a cool, dry place away from direct sunlight (like a drawer or cabinet). Avoid keeping medicines in bathroom cabinets due to moisture. Special medicines like insulin need refrigeration.';
    }
    if (q.includes('night') || q.includes('evening') || q.includes('sleep')) {
      return 'Certain medicines, like cholesterol pills or sleeping aids, work best when taken at night. Heart medications or blood pressure tablets might be scheduled in the morning. Follow the timings card on your home screen.';
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return 'Hello! How can I assist you with your medications today?';
    }

    return 'Thank you for asking. For specific medication questions, it is best to ask your primary doctor in the Chat tab, or check the doctor notes. If you are experiencing symptoms, seek medical advice.';
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userText = inputText.trim();
    setInputText('');

    const newMsg: ChatbotMsg = {
      id: Date.now().toString(),
      text: userText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [newMsg, ...prev]);
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const botMsg: ChatbotMsg = {
      id: (Date.now() + 1).toString(),
      text: getBotResponse(userText),
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [botMsg, ...prev]);
    setIsTyping(false);
  };

  const formatTime = (date: Date) => {
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
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>AI Copilot Active</Text>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() =>
            isTyping ? (
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color="#0EA5E9" />
                <Text style={styles.typingText}>Typing...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isUser = item.isUser;

            return (
              <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.botWrapper]}>
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                  {!isUser && (
                    <View style={styles.botIconLabel}>
                      <Bot color="#0EA5E9" size={14} style={{ marginRight: 6 }} />
                      <Text style={styles.botName}>AI Bot</Text>
                    </View>
                  )}
                  <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.botTimeText]}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask AI bot about side effects, storage..."
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
  headerTitle: {
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
    backgroundColor: '#0EA5E9',
    marginRight: 6,
  },
  statusText: {
    fontFamily: 'OutfitMedium',
    fontSize: 11,
    color: '#64748B',
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
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  botWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#0EA5E9',
    borderBottomRightRadius: 0,
  },
  botBubble: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 0,
  },
  botIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  botName: {
    fontFamily: 'OutfitBold',
    fontSize: 11,
    color: '#0EA5E9',
  },
  messageText: {
    fontFamily: 'Outfit',
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#0F172A',
  },
  timeText: {
    fontFamily: 'Outfit',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  userTimeText: {
    color: '#E0F2FE',
  },
  botTimeText: {
    color: '#94A3B8',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  typingText: {
    fontFamily: 'OutfitMedium',
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
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

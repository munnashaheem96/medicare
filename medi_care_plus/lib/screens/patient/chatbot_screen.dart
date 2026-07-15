import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class ChatbotMsg {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatbotMsg({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final List<ChatbotMsg> _messages = [];
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    // Welcome message
    _messages.add(ChatbotMsg(
      text: "Hello! I am your AI Health Assistant. How can I help you manage your medicines today? You can ask about side effects, missed doses, food instructions, or storage conditions.",
      isUser: false,
      timestamp: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // Smart local lookup mock responses
  String _getBotResponse(String query) {
    final q = query.toLowerCase();
    
    if (q.contains("miss") || q.contains("forget") || q.contains("forgot")) {
      return "If you miss a dose, take it as soon as you remember. However, if it is almost time for your next dose, skip the missed dose and resume your regular scheduling. Never take double doses to compensate!";
    }
    if (q.contains("food") || q.contains("eat") || q.contains("meal")) {
      return "Taking medicines 'Before Food' ensures optimal absorption in the stomach (usually 30-60 minutes before meals). 'After Food' helps protect your stomach lining from irritation (like aspirin or pain relievers). Please check your doctor's specific prescription label.";
    }
    if (q.contains("side effect") || q.contains("symptoms") || q.contains("harm")) {
      return "Side effects vary per drug. Mild effects like nausea, dizziness, or sleepiness are common. If you experience severe rashes, swelling, or breathing difficulty, seek emergency medical care immediately and notify your doctor.";
    }
    if (q.contains("store") || q.contains("keep") || q.contains("fridge")) {
      return "Most pills should be stored in a cool, dry place away from direct sunlight (like a drawer or cabinet). Avoid keeping medicines in bathroom cabinets due to moisture. Special medicines like insulin need refrigeration.";
    }
    if (q.contains("night") || q.contains("evening") || q.contains("sleep")) {
      return "Certain medicines, like cholesterol pills or sleeping aids, work best when taken at night. Heart medications or blood pressure tablets might be scheduled in the morning. Follow the timings card on your home screen.";
    }
    if (q.contains("hello") || q.contains("hi") || q.contains("hey")) {
      return "Hello! How can I assist you with your medications today?";
    }

    return "Thank you for asking. For specific medication questions, it is best to ask your primary doctor in the chat tab, or check the doctor notes. If you are experiencing symptoms, seek medical advice.";
  }

  void _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    _controller.clear();
    setState(() {
      _messages.add(ChatbotMsg(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _isTyping = true;
    });

    _scrollToBottom();

    // Simulated network/API typing delay
    await Future.delayed(const Duration(milliseconds: 1200));

    if (mounted) {
      setState(() {
        _isTyping = false;
        _messages.add(ChatbotMsg(
          text: _getBotResponse(text),
          isUser: false,
          timestamp: DateTime.now(),
        ));
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          "AI Health Assistant",
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          // Subheader disclaimer
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppTheme.warning.withValues(alpha: 0.08),
              border: const Border(
                top: BorderSide(color: AppTheme.borderLight, width: 1.5),
                bottom: BorderSide(color: AppTheme.borderLight, width: 1.5),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, size: 16, color: AppTheme.warning),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "AI chatbot provides general guidelines, not official medical advice.",
                    style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          
          // Conversation messages list
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              physics: const BouncingScrollPhysics(),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg.isUser;

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    padding: const EdgeInsets.all(14),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    decoration: BoxDecoration(
                      color: isUser ? null : Colors.white,
                      gradient: isUser ? AppTheme.primaryGradient : null,
                      boxShadow: AppTheme.premiumShadow,
                      border: isUser ? null : Border.all(color: AppTheme.borderLight, width: 1.5),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(20),
                        topRight: const Radius.circular(20),
                        bottomLeft: isUser ? const Radius.circular(20) : Radius.zero,
                        bottomRight: isUser ? Radius.zero : const Radius.circular(20),
                      ),
                    ),
                    child: Text(
                      msg.text,
                      style: GoogleFonts.outfit(
                        color: isUser ? Colors.white : AppTheme.textPrimary,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          
          if (_isTyping)
            Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.only(left: 20, bottom: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "AI is typing...",
                      style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textMuted, fontStyle: FontStyle.italic),
                    ),
                  ],
                ),
              ),
            ),
          
          // Input row
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 110), // Safe area bottom padding for floating navigation capsule
            decoration: BoxDecoration(
              color: Colors.white,
              border: const Border(top: BorderSide(color: AppTheme.borderLight)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      boxShadow: AppTheme.premiumShadow,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: TextField(
                      controller: _controller,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: "Ask about side effects, storage...",
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: AppTheme.borderLight, width: 1.5),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                        ),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    shape: BoxShape.circle,
                    boxShadow: AppTheme.glowShadow,
                  ),
                  child: IconButton(
                    onPressed: _sendMessage,
                    icon: const Icon(Icons.send_rounded, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

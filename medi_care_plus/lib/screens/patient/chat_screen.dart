import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/chat_message.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  final String patientId;
  final String patientName;
  final String doctorName;

  const ChatScreen({
    super.key,
    required this.patientId,
    required this.patientName,
    required this.doctorName,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(FirebaseService firebaseService) async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    _messageController.clear();
    try {
      await firebaseService.sendMessage(
        widget.patientId,
        widget.doctorName,
        widget.patientId, // sender ID is patientId
        widget.patientName,
        text,
      );
      // Scroll to bottom
      _scrollController.animateTo(
        0.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed to send message: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final firebaseService = Provider.of<FirebaseService>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.doctorName),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppTheme.success,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  "Online / Response within hours",
                  style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Doctor Info banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: AppTheme.surface,
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 16, color: AppTheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "You are messaging your primary doctor assigned by the hospital admin.",
                    style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ),
              ],
            ),
          ),
          
          // Messages List
          Expanded(
            child: StreamBuilder<List<ChatMessage>>(
              stream: firebaseService.streamChatMessages(widget.patientId, widget.doctorName),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text("Error: ${snapshot.error}"));
                }
                
                final messages = snapshot.data ?? [];
                
                if (messages.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.chat_bubble_outline, size: 64, color: AppTheme.textMuted),
                          const SizedBox(height: 16),
                          Text(
                            "Start your conversation",
                            style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Ask doctor about symptoms, prescriptions, side effects, or request refills here.",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(fontSize: 13, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  reverse: true, // newest messages at bottom
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index];
                    final isMe = msg.senderId == widget.patientId;

                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.75,
                        ),
                        decoration: BoxDecoration(
                          color: isMe ? AppTheme.primary : AppTheme.surface,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
                            bottomRight: isMe ? Radius.zero : const Radius.circular(16),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (!isMe)
                              Text(
                                msg.senderName,
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                            const SizedBox(height: 2),
                            Text(
                              msg.text,
                              style: GoogleFonts.outfit(
                                color: isMe ? Colors.white : AppTheme.textPrimary,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Align(
                              alignment: Alignment.bottomRight,
                              child: Text(
                                DateFormat('hh:mm a').format(msg.timestamp),
                                style: GoogleFonts.outfit(
                                  fontSize: 9,
                                  color: isMe ? Colors.white70 : AppTheme.textMuted,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          
          // Chat Input field
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppTheme.borderLight)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      hintText: "Type a message to your doctor...",
                      filled: true,
                      fillColor: AppTheme.surface,
                    ),
                    onSubmitted: (_) => _sendMessage(firebaseService),
                  ),
                ),
                const SizedBox(width: 12),
                FloatingActionButton(
                  onPressed: () => _sendMessage(firebaseService),
                  backgroundColor: AppTheme.primary,
                  mini: true,
                  elevation: 0,
                  child: const Icon(Icons.send, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/chat_message.dart';
import '../../services/firebase_service.dart';
import '../../theme/app_theme.dart';

class DoctorChatScreen extends StatefulWidget {
  final String patientId;
  final String patientName;
  final String doctorName;

  const DoctorChatScreen({
    super.key,
    required this.patientId,
    required this.patientName,
    required this.doctorName,
  });

  @override
  State<DoctorChatScreen> createState() => _DoctorChatScreenState();
}

class _DoctorChatScreenState extends State<DoctorChatScreen> {
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
        widget.doctorName, // sender ID is doctorName
        widget.doctorName,
        text,
      );
      _scrollController.animateTo(
        0.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed to send: $e")),
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
            Text("Chat: ${widget.patientName}"),
            Text(
              "Patient ID: ${widget.patientId}",
              style: GoogleFonts.outfit(fontSize: 11, color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
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
                
                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index];
                    final isDoctor = msg.senderId == widget.doctorName;

                    return Align(
                      alignment: isDoctor ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.75,
                        ),
                        decoration: BoxDecoration(
                          color: isDoctor ? AppTheme.primary : AppTheme.surface,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: isDoctor ? const Radius.circular(16) : Radius.zero,
                            bottomRight: isDoctor ? Radius.zero : const Radius.circular(16),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (!isDoctor)
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
                                color: isDoctor ? Colors.white : AppTheme.textPrimary,
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
                                  color: isDoctor ? Colors.white70 : AppTheme.textMuted,
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
                      hintText: "Respond to patient...",
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

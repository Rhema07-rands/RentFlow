import {
  ArrowLeft,
  CheckCheck,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Send,
  Square,
  Video,
  Volume2,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getInitials } from '../config/api';
import { useCustomAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';
import { useCall } from '../contexts/CallContext';
import { ChatMessage, useChat } from '../contexts/ChatContext';

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimeLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const ChatsPage: React.FC = () => {
  const { id: routeContactId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user, token } = useAuth();
  const {
    conversations,
    messages,
    isConnected,
    loadConversations,
    loadHistory,
    sendMessage,
    uploadAttachment,
    connect,
  } = useChat();
  const { startCall } = useCall();
  const { showAlert } = useCustomAlert();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeContactId = routeContactId || null;
  const activeConversation = conversations.find(
    (c) => c.contactId.toLowerCase() === activeContactId?.toLowerCase()
  );
  const displayName =
    searchParams.get('name') || activeConversation?.contactName || 'RentFlow Contact';

  useEffect(() => {
    if (token) {
      connect(token);
      loadConversations(token);
    }
  }, [token, connect, loadConversations]);

  useEffect(() => {
    if (token && activeContactId) {
      loadHistory(token, activeContactId);
    }
  }, [token, activeContactId, loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContactId]);

  const filteredConversations = conversations.filter(
    (c) =>
      c.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.latestMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeContactId) return;
    const text = inputText.trim();
    setInputText('');

    // Optimistic message append so message shows up instantly in the UI
    if (user) {
      const optimisticMsg: ChatMessage = {
        id: 'opt_' + Date.now().toString(),
        senderId: user.id,
        receiverId: activeContactId,
        content: text,
        messageType: 'text',
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      // Send will broadcast via SignalR
      await sendMessage(activeContactId, text, 'text');
    }
  };

  // Image & Document Upload Handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'document'
  ) => {
    const file = e.target.files?.[0];
    setShowAttachMenu(false);
    if (!file || !activeContactId) return;

    setUploadingMedia(true);
    try {
      const uploadedUrl = await uploadAttachment(file, file.name);
      if (uploadedUrl) {
        const payload = type === 'document' ? `${file.name}|${uploadedUrl}` : uploadedUrl;
        await sendMessage(activeContactId, payload, type);
      } else {
        // Fallback data URL if offline
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            const payload = type === 'document' ? `${file.name}|${reader.result}` : reader.result;
            await sendMessage(activeContactId, payload, type);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      showAlert('Upload Error', 'Failed to upload file.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // Voice Note Recording Logic
  const startVoiceRecording = async () => {
    if (!activeContactId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploadingMedia(true);
        try {
          const uploadedUrl = await uploadAttachment(audioBlob, `voicenote-${Date.now()}.webm`);
          if (uploadedUrl) {
            await sendMessage(activeContactId, uploadedUrl, 'voice');
          } else {
            const reader = new FileReader();
            reader.onloadend = async () => {
              if (typeof reader.result === 'string') {
                await sendMessage(activeContactId, reader.result, 'voice');
              }
            };
            reader.readAsDataURL(audioBlob);
          }
        } finally {
          setUploadingMedia(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      showAlert(
        'Microphone Access Needed',
        'Please allow microphone access in your browser to record voice notes.'
      );
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        audioChunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Group messages by Date
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const renderMessageContent = (msg: ChatMessage, isMe: boolean) => {
    if (msg.messageType === 'image') {
      return (
        <div className="space-y-1.5">
          <img
            src={msg.content}
            alt="Shared attachment"
            onClick={() => setLightboxImage(msg.content)}
            className="max-h-64 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity border border-white/10"
          />
        </div>
      );
    }

    if (msg.messageType === 'voice') {
      return (
        <div className="flex items-center gap-3 min-w-[230px] sm:min-w-[270px] py-1">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isMe ? 'bg-white/20 text-white' : 'bg-[#38BDF8]/15 text-[#38BDF8]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </div>
          <audio src={msg.content} controls className="h-9 w-full max-w-[220px]" />
        </div>
      );
    }

    if (msg.messageType === 'document') {
      const parts = msg.content.split('|');
      const fileName = parts.length > 1 ? parts[0] : 'Shared Document';
      const fileUrl = parts.length > 1 ? parts.slice(1).join('|') : msg.content;

      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
            isMe
              ? 'bg-blue-700/50 border-white/15 text-white hover:bg-blue-700/70'
              : 'bg-[#0F172A]/80 border-white/10 text-[#F8FAFC] hover:border-[#38BDF8]/50'
          }`}
        >
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{fileName}</p>
            <p className="text-[10px] opacity-75">Click to open / download</p>
          </div>
          <Download className="w-4 h-4 opacity-80 shrink-0" />
        </a>
      );
    }

    return <p className="text-sm sm:text-[15px] leading-relaxed break-words">{msg.content}</p>;
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-5rem)] md:h-screen overflow-hidden bg-[#0F172A]">
      {/* Left Pane: Conversations List */}
      <div
        className={`${
          activeContactId ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-96 flex-col border-r border-white/5 bg-[#0F172A] shrink-0`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#F8FAFC]">Chats</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard/call-history')}
            className="w-10 h-10 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-[#F8FAFC] hover:border-[#38BDF8] transition-colors"
            title="Call History"
          >
            <PhoneCall className="w-4 h-4 text-[#38BDF8]" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="flex items-center bg-[#1E293B] border border-white/10 rounded-2xl px-4 h-11">
            <Search className="w-4 h-4 text-[#64748B] mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
          {filteredConversations.length === 0 ? (
            <div className="text-center p-10 text-[#64748B]">
              <p className="text-sm font-semibold text-[#94A3B8]">No conversations yet</p>
              <p className="text-xs mt-1">
                Open any property listing and click &ldquo;Apply / Chat with Owner&rdquo; to start chatting!
              </p>
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const isSelected =
                activeContactId?.toLowerCase() === chat.contactId.toLowerCase();
              const time = chat.latestMessage?.timestamp
                ? new Date(chat.latestMessage.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              let preview = chat.latestMessage?.content || 'Started a conversation';
              if (chat.latestMessage?.messageType === 'image') preview = '📷 Photo';
              else if (chat.latestMessage?.messageType === 'document') preview = '📄 Document';
              else if (chat.latestMessage?.messageType === 'voice') preview = '🎤 Voice Note';

              return (
                <div
                  key={chat.contactId}
                  onClick={() =>
                    navigate(
                      `/dashboard/conversation/${chat.contactId}?name=${encodeURIComponent(
                        chat.contactName
                      )}`
                    )
                  }
                  className={`flex items-center gap-3.5 px-6 py-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#1E293B]' : 'hover:bg-[#1E293B]/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                    {getInitials(chat.contactName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-[#F8FAFC] truncate">
                        {chat.contactName}
                      </h4>
                      <span className="text-[11px] text-[#64748B] shrink-0">{time}</span>
                    </div>
                    <p
                      className={`text-xs truncate ${
                        chat.unreadCount > 0 ? 'text-[#F8FAFC] font-bold' : 'text-[#94A3B8]'
                      }`}
                    >
                      {preview}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#38BDF8] text-[#0F172A] text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Active Conversation Window */}
      {activeContactId ? (
        <div className="flex-1 flex flex-col bg-[#0F172A] min-w-0">
          {/* Conversation Header */}
          <div className="h-20 px-6 border-b border-white/5 bg-[#0F172A]/90 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                onClick={() => navigate('/dashboard/chats')}
                className="lg:hidden p-2 rounded-xl bg-[#1E293B] text-[#F8FAFC]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {getInitials(displayName)}
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#F8FAFC] truncate">{displayName}</h2>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400' : 'bg-[#64748B]'
                    }`}
                  />
                  <span className="text-xs text-[#94A3B8]">
                    {isConnected ? 'Online • Instant Delivery' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Audio & Video Call Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => startCall(activeContactId, displayName, 'audio')}
                className="w-10 h-10 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0F172A] flex items-center justify-center transition-all"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => startCall(activeContactId, displayName, 'video')}
                className="w-10 h-10 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0F172A] flex items-center justify-center transition-all"
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {sortedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#64748B]">
                <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mb-3 text-[#38BDF8] font-bold text-xl">
                  {getInitials(displayName)}
                </div>
                <p className="text-sm font-bold text-[#F8FAFC]">Chat with {displayName}</p>
                <p className="text-xs text-[#94A3B8] max-w-xs mt-1">
                  Send a message, photo, document, or voice note to start your conversation.
                </p>
              </div>
            ) : (
              (() => {
                let lastDate = '';
                return sortedMessages.map((msg, index) => {
                  const msgDate = new Date(msg.timestamp).toDateString();
                  const showDatePill = msgDate !== lastDate;
                  lastDate = msgDate;
                  const isMe =
                    Boolean(user && msg.senderId.toLowerCase() === user.id.toLowerCase());

                  return (
                    <React.Fragment key={msg.id || index}>
                      {showDatePill && (
                        <div className="flex justify-center my-4">
                          <span className="px-3.5 py-1 rounded-full bg-[#1E293B] border border-white/5 text-[11px] font-semibold text-[#94A3B8]">
                            {formatDateLabel(msg.timestamp)}
                          </span>
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl shadow-md ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-[#1E293B] text-[#F8FAFC] rounded-bl-sm border border-white/5'
                          }`}
                        >
                          {renderMessageContent(msg, isMe)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[10px] text-[#64748B]">
                            {formatTimeLabel(msg.timestamp)}
                          </span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#38BDF8]" />}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-[#1E293B] border-t border-white/5 relative">
            {/* Share Files Popover */}
            {showAttachMenu && (
              <div className="absolute bottom-20 left-4 bg-[#0F172A] border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-4 z-20 animate-in fade-in slide-in-from-bottom-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#F8FAFC]">Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#F8FAFC]">Document</span>
                </button>
              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'image')}
              className="hidden"
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,application/*"
              onChange={(e) => handleFileUpload(e, 'document')}
              className="hidden"
            />

            {isRecording ? (
              <div className="flex items-center justify-between bg-[#0F172A] border border-red-500/40 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <span className="text-sm font-bold text-red-400">
                    Recording Voice Note... {Math.floor(recordingSeconds / 60)}:
                    {(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 text-xs font-bold text-[#94A3B8] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(false)}
                    className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Send Voice Note</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendText} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  disabled={uploadingMedia}
                  className="w-11 h-11 rounded-full bg-[#334155] hover:bg-[#475569] text-[#F8FAFC] flex items-center justify-center shrink-0 transition-colors"
                  title="Attach Image or Document"
                >
                  {uploadingMedia ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#38BDF8]" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 flex items-center bg-[#0F172A] border border-white/10 focus-within:border-[#38BDF8] rounded-full px-4 py-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 bg-transparent text-[#F8FAFC] placeholder-[#64748B] focus:outline-none text-sm"
                  />

                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="p-1.5 text-[#94A3B8] hover:text-[#38BDF8] transition-colors"
                    title="Record Voice Note"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-[#334155] text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#0F172A] text-center p-12">
          <div className="w-20 h-20 rounded-3xl bg-[#1E293B] border border-white/10 flex items-center justify-center mb-4 text-[#38BDF8]">
            <Send className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#F8FAFC]">RentFlow Web Messenger</h2>
          <p className="text-sm text-[#94A3B8] max-w-md mt-2">
            Select a conversation from the left panel to send real-time messages, photos, PDF agreements, voice notes, or start an encrypted audio/video call.
          </p>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[8000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full attachment"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
};

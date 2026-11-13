'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Megaphone, 
  Paperclip, 
  Search, 
  Send, 
  ShieldAlert, 
  Users, 
  Lock, 
  Pin,
  CheckCircle2,
  Clock,
  Flag,
  Sparkles
} from 'lucide-react';
import { getConversations, getMessages, sendMessage, getMyProfile } from '@/lib/api';
import { Conversation, MessageItem, StudentProfile } from '@/types';
import { TrustBadge } from '@/components/shared/TrustBadge';
import { ReportModal } from '@/components/shared/ReportModal';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeGroupSubTab, setActiveGroupSubTab] = useState<'announcements' | 'chat' | 'vault'>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<StudentProfile | null>(null);

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [convs, prof] = await Promise.all([
        getConversations(),
        getMyProfile(),
      ]);
      setConversations(convs);
      setMyProfile(prof);
      if (convs.length > 0) {
        setSelectedConvId(convs[0].id);
        const msgs = await getMessages(convs[0].id);
        setMessages(msgs);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSelectConv = async (convId: string) => {
    setSelectedConvId(convId);
    const msgs = await getMessages(convId);
    setMessages(msgs);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;
    try {
      const newMsg = await sendMessage(selectedConvId, messageInput.trim());
      setMessages([...messages, newMsg]);
      setMessageInput('');
    } catch {
      alert('Failed to deliver message');
    }
  };

  const currentConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const isAnnouncementOnly = currentConv?.conversation_type === 'ANNOUNCEMENT_CHANNEL';

  const filteredMessages = messages.filter((m) => {
    if (activeGroupSubTab === 'announcements') return m.is_announcement;
    if (messageSearch) return m.body.toLowerCase().includes(messageSearch.toLowerCase());
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col">
      <div className="celestial-card flex-1 flex flex-col md:flex-row overflow-hidden border border-purple-500/30">
        {/* Left: Channels & Direct Messages Sidebar */}
        <div className="w-full md:w-80 border-r border-purple-500/20 flex flex-col shrink-0 bg-[#0B0524]/85 backdrop-blur-xl">
          {/* Header */}
          <div className="p-3.5 border-b border-purple-500/20 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#F8F7FF] flex items-center gap-1.5">
              <span>✦ Communication Layer</span>
            </span>
            <span className="neo-badge text-[9px] bg-purple-900/60 text-[#FDE68A] border-purple-400/30">
              BLR ACTIVE
            </span>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-purple-500/10">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-[#7C6FA6]">
                <MessageSquare className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-40" />
                <p>No active conversations yet.</p>
                <p className="text-[10px] text-[#C4B5FD] mt-1">Join campus communities or message a classmate!</p>
              </div>
            ) : (
              conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isAnnounce = conv.conversation_type === 'ANNOUNCEMENT_CHANNEL';
              const isDirect = conv.conversation_type === 'DIRECT';

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`relative w-full text-left p-3.5 transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-transparent text-[#FDE68A]'
                      : 'hover:bg-purple-900/20 text-[#C4B5FD]'
                  }`}
                >
                  {/* Lit Window Indicator */}
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#FDE68A] via-[#FBBF24] to-[#F59E0B] rounded-r-full shadow-[0_0_12px_#FBBF24]" />
                  )}

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono font-bold border transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#2E1065] to-[#120836] border-amber-400/50 text-[#FBBF24] shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                      : 'bg-purple-950/60 border-purple-400/30 text-purple-300'
                  }`}>
                    {isAnnounce ? <Megaphone className="w-3.5 h-3.5 text-amber-300" /> : isDirect ? '@' : '#'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-mono font-bold truncate ${
                        isSelected ? 'text-[#F8F7FF]' : 'text-[#C4B5FD]'
                      }`}>
                        {conv.title || 'Conversation'}
                      </span>
                      <span className="text-[9px] font-mono text-[#7C6FA6] shrink-0 ml-1">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7C6FA6] truncate">
                      {conv.last_message || conv.description || 'No recent messages'}
                    </p>
                  </div>
                </button>
              );
            }))}
          </div>
        </div>

        {/* Right: Message Stream & Sub-Tabs */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#07031A]/90 backdrop-blur-xl">
          {currentConv ? (
            <>
              {/* Header with Title and 3 Sub-Tabs */}
              <div className="p-4 border-b border-purple-500/20 bg-purple-950/20">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-[#F8F7FF] truncate">
                      {currentConv.title}
                    </h2>
                    <span className="neo-badge text-[9px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                      {currentConv.conversation_type}
                    </span>
                  </div>

                  {/* Message Search */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-[#7C6FA6] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      placeholder="Search messages..."
                      className="celestial-input text-[11px] font-mono py-1 pl-7 pr-3 rounded-full w-36 sm:w-48"
                    />
                  </div>
                </div>

                {/* 3 Clean Sub-Tabs for Group Communication */}
                {currentConv.conversation_type !== 'DIRECT' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveGroupSubTab('announcements')}
                      className={`pill-glass text-xs ${
                        activeGroupSubTab === 'announcements' ? 'pill-glass-active' : ''
                      }`}
                    >
                      <Megaphone className="w-3 h-3" />
                      <span>Announcements</span>
                    </button>

                    <button
                      onClick={() => setActiveGroupSubTab('chat')}
                      className={`pill-glass text-xs ${
                        activeGroupSubTab === 'chat' ? 'pill-glass-active' : ''
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Discussion Chat</span>
                    </button>

                    <button
                      onClick={() => setActiveGroupSubTab('vault')}
                      className={`pill-glass text-xs ${
                        activeGroupSubTab === 'vault' ? 'pill-glass-active' : ''
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>Pinned Vault</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {activeGroupSubTab === 'vault' ? (
                  <div className="p-8 text-center text-xs font-mono text-[#C4B5FD] celestial-card m-4">
                    <Pin className="w-8 h-8 mx-auto mb-3 text-[#FBBF24] drop-shadow-[0_0_10px_#FBBF24]" />
                    <p className="font-bold text-base text-[#F8F7FF] mb-1 font-display">
                      Pinned Resource Vault
                    </p>
                    <p className="max-w-md mx-auto text-[#7C6FA6] leading-relaxed">
                      All syllabus guides, exam papers, and shared project links pinned in this space are permanently preserved here for students.
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isMe = msg.sender_id === myProfile?.user_id;

                    return (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl max-w-xl transition-all ${
                          msg.is_announcement
                            ? 'celestial-card-amber mx-auto w-full max-w-2xl'
                            : isMe
                            ? 'ml-auto bg-gradient-to-br from-purple-600/90 to-indigo-800/90 border border-purple-400/40 text-white shadow-[0_4px_20px_rgba(124,58,237,0.25)]'
                            : 'mr-auto bg-[#160B3E]/60 border border-purple-500/25 text-[#F8F7FF]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#F8F7FF]">
                              {msg.sender_name || 'Student'}
                            </span>
                            <span className="text-[10px] font-mono text-[#C4B5FD]/75">
                              @{msg.sender_handle || 'user'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.is_announcement && (
                              <span className="neo-badge text-[8px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40 font-bold">
                                ✦ ANNOUNCEMENT
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setReportTarget({ id: msg.id, type: 'MESSAGE', title: msg.body })}
                            className="text-[#7C6FA6] hover:text-rose-400 p-1"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-xs text-[#F8F7FF] leading-relaxed">
                          {msg.body}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Composer */}
              <div className="p-3.5 border-t border-purple-500/20 bg-purple-950/20">
                {isAnnouncementOnly && myProfile?.verification_stage === 'STAGE_1_PROVISIONAL' ? (
                  <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/20 text-center text-xs font-mono text-[#C4B5FD] flex items-center justify-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>Only class/club representatives can publish official announcements.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${currentConv.title}...`}
                      className="celestial-input flex-1 text-xs font-mono p-3 rounded-full"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="btn-campus-amber text-xs font-mono py-2.5 px-5 rounded-full"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-[#7C6FA6]">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>

      {/* Universal Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
        />
      )}
    </div>
  );
}

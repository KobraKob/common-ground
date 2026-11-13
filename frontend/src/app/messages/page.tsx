'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Flag
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
  const messageRequestId = useRef(0);

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const [convs, prof] = await Promise.all([
        getConversations(),
        getMyProfile(),
      ]);
      if (!isMounted) return;

      setConversations(convs);
      setMyProfile(prof);
      if (convs.length > 0) {
        const requestId = ++messageRequestId.current;
        setSelectedConvId(convs[0].id);
        const msgs = await getMessages(convs[0].id);
        if (isMounted && requestId === messageRequestId.current) setMessages(msgs);
      }
      if (isMounted) setLoading(false);
    }

    loadData();
    return () => {
      isMounted = false;
      messageRequestId.current += 1;
    };
  }, []);

  const handleSelectConv = async (convId: string) => {
    const requestId = ++messageRequestId.current;
    setSelectedConvId(convId);
    setMessages([]);
    const msgs = await getMessages(convId);
    if (requestId === messageRequestId.current) setMessages(msgs);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;
    try {
      const newMsg = await sendMessage(selectedConvId, messageInput.trim());
      setMessages((current) => [...current, newMsg]);
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
      <div className="neo-card flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-[#151726]">
        {/* Left: Channels & Direct Messages Sidebar */}
        <div className="w-full md:w-80 border-r border-[#CCCFFA] dark:border-[#282C47] flex flex-col shrink-0 bg-white dark:bg-[#0E0F1A]">
          {/* Header */}
          <div className="p-3.5 border-b border-[#CCCFFA] dark:border-[#282C47] flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-gray-900 dark:text-white">
              Communication Layer
            </span>
            <span className="neo-badge text-[9px] bg-[#C5E17A]/20 text-[#1A1C29] dark:text-[#C5E17A]">
              BLR CHAT
            </span>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isAnnounce = conv.conversation_type === 'ANNOUNCEMENT_CHANNEL';
              const isDirect = conv.conversation_type === 'DIRECT';

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#F5F6FD] dark:bg-[#151726] border-l-4 border-l-[#C5E17A]'
                      : 'hover:bg-gray-50 dark:hover:bg-[#151726]/50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#1A1C29] dark:bg-gray-800 text-[#C5E17A] flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                    {isAnnounce ? <Megaphone className="w-3.5 h-3.5" /> : isDirect ? '@' : '#'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-mono font-bold truncate text-gray-900 dark:text-white">
                        {conv.title || 'Conversation'}
                      </span>
                      <span className="text-[9px] font-mono text-gray-400 shrink-0 ml-1">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {conv.last_message || conv.description || 'No recent messages'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Message Stream & Sub-Tabs */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#151726]">
          {currentConv ? (
            <>
              {/* Header with Title and 3 Sub-Tabs */}
              <div className="p-4 border-b border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD]/50 dark:bg-[#0E0F1A]/50">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="neo-heading text-lg font-bold text-gray-900 dark:text-white truncate">
                      {currentConv.title}
                    </h2>
                    <span className="neo-badge text-[9px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                      {currentConv.conversation_type}
                    </span>
                  </div>

                  {/* Message Search */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      placeholder="Search messages..."
                      className="text-[11px] font-mono py-1 pl-7 pr-3 rounded-full border border-[#CCCFFA] dark:border-[#282C47] bg-white dark:bg-[#151726] text-gray-900 dark:text-gray-100 focus:outline-none w-36 sm:w-48"
                    />
                  </div>
                </div>

                {/* 3 Clean Sub-Tabs for Group Communication (Section 6.4) */}
                {currentConv.conversation_type !== 'DIRECT' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveGroupSubTab('announcements')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                        activeGroupSubTab === 'announcements'
                          ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A] font-bold'
                          : 'border border-[#CCCFFA] dark:border-[#282C47] text-gray-600 dark:text-gray-400 hover:border-[#C5E17A]'
                      }`}
                    >
                      <Megaphone className="w-3 h-3" />
                      <span>Announcements</span>
                    </button>

                    <button
                      onClick={() => setActiveGroupSubTab('chat')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                        activeGroupSubTab === 'chat'
                          ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A] font-bold'
                          : 'border border-[#CCCFFA] dark:border-[#282C47] text-gray-600 dark:text-gray-400 hover:border-[#C5E17A]'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Discussion Chat</span>
                    </button>

                    <button
                      onClick={() => setActiveGroupSubTab('vault')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                        activeGroupSubTab === 'vault'
                          ? 'bg-[#1A1C29] text-[#C5E17A] dark:bg-[#C5E17A] dark:text-[#0E0F1A] font-bold'
                          : 'border border-[#CCCFFA] dark:border-[#282C47] text-gray-600 dark:text-gray-400 hover:border-[#C5E17A]'
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
                  <div className="p-6 text-center text-xs font-mono text-gray-500">
                    <Pin className="w-8 h-8 mx-auto mb-2 text-[#C5E17A]" />
                    <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Pinned Resource Vault</p>
                    <p>All syllabus guides, exam papers, and shared project links pinned in this space are permanently preserved here.</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-lg border border-[#CCCFFA]/50 dark:border-[#282C47]/50 bg-[#F5F6FD]/40 dark:bg-[#0E0F1A]/40">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                            {msg.sender_name || 'Student'}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            @{msg.sender_handle || 'user'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.is_announcement && (
                            <span className="neo-badge text-[8px] bg-red-500/10 text-red-500 border-red-500/30">
                              ANNOUNCEMENT
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setReportTarget({ id: msg.id, type: 'MESSAGE', title: msg.body })}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Composer */}
              <div className="p-3 border-t border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD]/50 dark:bg-[#0E0F1A]/50">
                {isAnnouncementOnly && myProfile?.verification_stage === 'STAGE_1_PROVISIONAL' ? (
                  <div className="p-2.5 rounded bg-gray-100 dark:bg-gray-800 text-center text-xs font-mono text-gray-500 flex items-center justify-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Only class/club representatives can publish official announcements.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${currentConv.title}...`}
                      className="flex-1 text-xs font-mono p-2.5 rounded-full border border-[#CCCFFA] dark:border-[#282C47] bg-white dark:bg-[#151726] text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#C5E17A]"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="neo-pill-btn neo-pill-btn-primary py-2 px-4"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-gray-400">
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

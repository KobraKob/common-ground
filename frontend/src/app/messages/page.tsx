'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, 
  Megaphone, 
  Search, 
  Send, 
  Lock, 
  Pin,
  Flag,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { getConversations, getMessagesPaginated, sendMessage, getMyProfile, isAuthenticated } from '@/lib/api';
import { Conversation, MessageItem, StudentProfile } from '@/types';
import { ReportModal } from '@/components/shared/ReportModal';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [activeGroupSubTab, setActiveGroupSubTab] = useState<'announcements' | 'chat' | 'vault'>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [notice, setNotice] = useState('');
  const [myProfile, setMyProfile] = useState<StudentProfile | null>(null);

  // Report modal
  const [reportTarget, setReportTarget] = useState<{ id: string; type: any; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      const authenticated = isAuthenticated();
      setSignedIn(authenticated);
      if (!authenticated) { setLoading(false); return; }
      setLoading(true);
      try {
        const [convs, prof] = await Promise.all([
          getConversations(),
          getMyProfile(),
        ]);
        setConversations(convs || []);
        setMyProfile(prof);
        const requestedConversationId = new URLSearchParams(window.location.search).get('conversation');
        const selectedConversation = (convs || []).find((conversation) => conversation.id === requestedConversationId) || (convs || [])[0];
        if (selectedConversation) {
          setSelectedConvId(selectedConversation.id);
          const page = await getMessagesPaginated({ conversationId: selectedConversation.id, limit: 50, offset: 0 });
          setMessages(page.items);
          setMessagesOffset(page.nextOffset);
          setHasMoreMessages(page.hasMore);
        }
      } catch (err: any) {
        console.warn('Could not load conversations:', err);
        setNotice(err?.detail || 'Could not load conversations. Refresh to try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectConv = async (convId: string) => {
    setSelectedConvId(convId);
    setMessages([]);
    setMessagesOffset(0);
    setHasMoreMessages(false);
    try {
      const page = await getMessagesPaginated({ conversationId: convId, limit: 50, offset: 0 });
      setMessages(page.items);
      setMessagesOffset(page.nextOffset);
      setHasMoreMessages(page.hasMore);
    } catch (err: any) {
      console.warn('Failed to load thread messages:', err);
      setNotice(err?.detail || 'Could not load this conversation.');
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedConvId || !hasMoreMessages || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const page = await getMessagesPaginated({ conversationId: selectedConvId, limit: 50, offset: messagesOffset });
      setMessages((current) => [...page.items, ...current]);
      setMessagesOffset(page.nextOffset);
      setHasMoreMessages(page.hasMore);
    } catch (error: any) {
      setNotice(error?.detail || 'Could not load older messages.');
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId) return;
    try {
      const newMsg = await sendMessage(selectedConvId, messageInput.trim());
      setMessages((current) => [...current, newMsg]);
      setConversations((current) => current.map((conversation) => conversation.id === selectedConvId ? { ...conversation, last_message: newMsg.body, last_message_at: newMsg.created_at } : conversation).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
      setMessageInput('');
      setNotice('');
    } catch (error: any) {
      setNotice(error?.detail || 'Message could not be delivered. Check your connection and contact permissions.');
    }
  };

  const currentConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const isAnnouncementOnly = currentConv?.conversation_type === 'ANNOUNCEMENT_CHANNEL';

  const filteredMessages = messages.filter((m) => {
    if (activeGroupSubTab === 'announcements') return m.is_announcement;
    if (messageSearch) return m.body.toLowerCase().includes(messageSearch.toLowerCase());
    return true;
  });

  if (!loading && !signedIn) {
    return <div className="cg-page"><section className="cg-surface mx-auto max-w-xl space-y-4 p-8 text-center"><MessageSquare className="mx-auto text-[var(--cg-accent)]" size={30}/><h1 className="text-2xl font-semibold">Your messages</h1><p className="text-sm cg-muted">Sign in to open conversations and message students who allow contact.</p><Link href="/login" className="btn-campus-amber inline-flex min-h-11 items-center rounded-full px-5">Sign in</Link></section></div>;
  }

  return (
    <div className="cg-page max-w-6xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col">
      {notice && <p role="status" className="mb-3 rounded-xl border border-[var(--cg-border)] bg-[var(--cg-elevated)] p-3 text-sm">{notice}</p>}
      <div className="celestial-card flex-1 flex flex-col md:flex-row overflow-hidden border border-white/10 bg-[#12151F] rounded-xl shadow-2xl">
        {/* Left: Channels & Direct Messages Sidebar */}
        <div className="w-full md:w-80 border-r border-white/10 flex flex-col shrink-0 bg-[#0E1017]">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#F8F7FF] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Channels &amp; DMs</span>
            </span>
            <span className="neo-badge text-[9px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30">
              CAMPUS MESH
            </span>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center gap-3 p-2">
                    <div className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-24 h-3.5 rounded skeleton-shimmer" />
                      <div className="w-36 h-2.5 rounded skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
                <p className="font-bold text-white">No active conversations</p>
                <p className="text-[11px] text-slate-500">Join a campus community or start a direct peer thread.</p>
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
                        ? 'bg-amber-500/10 text-[#FDE68A]'
                        : 'hover:bg-white/[0.04] text-slate-300'
                    }`}
                  >
                    {/* Lit Window Active Indicator */}
                    {isSelected && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-r-full shadow-[0_0_12px_#FBBF24]" />
                    )}

                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-mono font-bold border transition-colors ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400/50 text-[#FBBF24]'
                        : 'bg-white/[0.03] border-white/10 text-slate-400'
                    }`}>
                      {isAnnounce ? (
                        <Megaphone className="w-4 h-4 text-amber-400" />
                      ) : isDirect ? (
                        <span className="text-sm">@</span>
                      ) : (
                        <Users className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-mono font-bold truncate ${
                          isSelected ? 'text-white' : 'text-slate-200'
                        }`}>
                          {conv.title || 'Conversation'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-1">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {conv.last_message || conv.description || 'No recent messages'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Stream & Sub-Tabs */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#12151F]">
          {currentConv ? (
            <>
              {/* Header with Title and Sub-Tabs */}
              <div className="p-4 border-b border-white/10 bg-[#0E1017]">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base sm:text-lg font-bold text-[#F8F7FF] truncate">
                      {currentConv.title}
                    </h2>
                    <span className="neo-badge text-[9px] bg-white/5 text-slate-400 border-white/10">
                      {currentConv.conversation_type}
                    </span>
                  </div>

                  {/* Message Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      placeholder="Search messages..."
                      className="celestial-input text-[11px] font-mono py-1.5 pl-8 pr-3 rounded-xl border border-white/10 bg-[#12151F] text-white placeholder:text-slate-500 w-36 sm:w-48 focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Sub-Tabs for Group Communication */}
                {currentConv.conversation_type !== 'DIRECT' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveGroupSubTab('announcements')}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
                        activeGroupSubTab === 'announcements'
                          ? 'bg-amber-400/15 text-[#FDE68A] font-bold border border-amber-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <Megaphone className="w-3 h-3" />
                      <span>Announcements</span>
                    </button>

                    <button
                      onClick={() => setActiveGroupSubTab('chat')}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
                        activeGroupSubTab === 'chat'
                          ? 'bg-amber-400/15 text-[#FDE68A] font-bold border border-amber-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Discussion Chat</span>
                    </button>

                    <button
                      onClick={() => setActiveGroupSubTab('vault')}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
                        activeGroupSubTab === 'vault'
                          ? 'bg-amber-400/15 text-[#FDE68A] font-bold border border-amber-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>Pinned Vault</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5">
                {hasMoreMessages && activeGroupSubTab !== 'vault' && <div className="flex justify-center"><button type="button" onClick={loadOlderMessages} disabled={isLoadingOlder} className="min-h-11 rounded-full border border-[var(--cg-border)] px-4 text-xs cg-muted disabled:opacity-50">{isLoadingOlder ? 'Loading older messages…' : 'Load older messages'}</button></div>}
                {activeGroupSubTab === 'vault' ? (
                  <div className="p-8 text-center text-xs font-mono text-slate-400 celestial-card border border-white/10 bg-[#0E1017] rounded-xl m-4 space-y-3">
                    <Pin className="w-8 h-8 mx-auto text-amber-400" />
                    <div>
                      <h3 className="font-bold text-base text-white mb-1 font-display">
                        Pinned Resource Vault
                      </h3>
                      <p className="max-w-md mx-auto text-slate-400 leading-relaxed font-sans text-xs">
                        All syllabus guides, exam blueprints, and shared repository links pinned in this space are permanently preserved here for students.
                      </p>
                    </div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No messages in this view yet. Start the conversation!
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isMe = msg.sender_id === myProfile?.user_id;

                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl max-w-xl transition-all space-y-1.5 ${
                          msg.is_announcement
                            ? 'bg-amber-500/10 border border-amber-400/30 mx-auto w-full max-w-2xl'
                            : isMe
                            ? 'ml-auto bg-amber-500/15 border border-amber-400/30 text-amber-50 shadow-sm'
                            : 'mr-auto bg-[#0E1017] border border-white/10 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white">
                              {msg.sender_name || 'Student'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              @{msg.sender_handle || 'user'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.is_announcement && (
                              <span className="neo-badge text-[8px] bg-amber-500/20 text-[#FDE68A] border-amber-400/40 font-bold flex items-center gap-0.5">
                                <Megaphone className="w-2.5 h-2.5 text-amber-400" />
                                <span>OFFICIAL</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => setReportTarget({ id: msg.id, type: 'MESSAGE', title: msg.body })}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Report message"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                          {msg.body}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Composer */}
              <div className="p-3.5 border-t border-white/10 bg-[#0E1017]">
                {isAnnouncementOnly && myProfile?.verification_stage === 'STAGE_1_PROVISIONAL' ? (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Only verified department and club representatives can publish official announcements.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Message ${currentConv.title}...`}
                      className="celestial-input flex-1 text-xs font-mono p-3 rounded-xl border border-white/10 bg-[#12151F] text-white placeholder:text-slate-500 focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="btn-campus-amber text-xs font-mono py-2.5 px-5 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-slate-500">
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

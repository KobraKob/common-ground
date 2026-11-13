'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Flag, MessageSquare, Pin, Search, Send, Users } from 'lucide-react';
import { getConversations, getMessagesPaginated, getMyProfile, isAuthenticated, sendMessage } from '@/lib/api';
import type { Conversation, MessageItem, StudentProfile } from '@/types';
import { ReportModal } from '@/components/shared/ReportModal';

type ThreadTab = 'chat' | 'announcements' | 'vault';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [threadTab, setThreadTab] = useState<ThreadTab>('chat');
  const [conversationSearch, setConversationSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [notice, setNotice] = useState('');
  const [myProfile, setMyProfile] = useState<StudentProfile | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: string; title: string } | null>(null);

  async function loadMessages(conversationId: string) {
    const page = await getMessagesPaginated({ conversationId, limit: 50, offset: 0 });
    setMessages(page.items);
    setMessagesOffset(page.nextOffset);
    setHasMoreMessages(page.hasMore);
    setMessageSearch('');
  }

  useEffect(() => {
    let active = true;
    async function loadData() {
      const authenticated = isAuthenticated();
      if (!active) return;
      setSignedIn(authenticated);
      if (!authenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [convs, profile] = await Promise.all([getConversations(), getMyProfile()]);
        if (!active) return;
        setConversations(convs || []);
        setMyProfile(profile);
        const requestedId = new URLSearchParams(window.location.search).get('conversation');
        const selected = (convs || []).find((conversation) => conversation.id === requestedId) || (convs || [])[0];
        if (selected) {
          setSelectedConvId(selected.id);
          setShowMobileList(false);
          await loadMessages(selected.id);
        }
      } catch (error: any) {
        if (active) setNotice(error?.detail || 'Could not load conversations. Refresh to try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadData();
    return () => { active = false; };
  }, []);

  const currentConversation = conversations.find((conversation) => conversation.id === selectedConvId) || conversations[0];
  const isGroupConversation = currentConversation?.conversation_type !== 'DIRECT';
  const canPostAnnouncement = currentConversation?.member_role === 'OWNER' || currentConversation?.member_role === 'MODERATOR';
  const announcementOnly = currentConversation?.conversation_type === 'ANNOUNCEMENT_CHANNEL' && !canPostAnnouncement;

  const filteredConversations = useMemo(() => {
    const term = conversationSearch.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.title || ''} ${conversation.last_message || ''}`.toLowerCase().includes(term)
    );
  }, [conversations, conversationSearch]);

  const filteredMessages = useMemo(() => messages.filter((message) => {
    if (isGroupConversation && threadTab === 'announcements' && !message.is_announcement) return false;
    if (isGroupConversation && threadTab === 'vault' && !message.is_pinned) return false;
    if (isGroupConversation && threadTab === 'chat' && message.is_announcement) return false;
    if (messageSearch && !message.body.toLowerCase().includes(messageSearch.toLowerCase())) return false;
    return true;
  }), [messages, isGroupConversation, threadTab, messageSearch]);

  async function selectConversation(conversationId: string) {
    setSelectedConvId(conversationId);
    setShowMobileList(false);
    setNotice('');
    setMessages([]);
    setMessagesOffset(0);
    setHasMoreMessages(false);
    try {
      await loadMessages(conversationId);
    } catch (error: any) {
      setNotice(error?.detail || 'Could not load this conversation.');
    }
  }

  async function loadOlderMessages() {
    if (!selectedConvId || !hasMoreMessages || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const page = await getMessagesPaginated({
        conversationId: selectedConvId,
        limit: 50,
        offset: messagesOffset,
      });
      setMessages((current) => [...page.items, ...current]);
      setMessagesOffset(page.nextOffset);
      setHasMoreMessages(page.hasMore);
    } catch (error: any) {
      setNotice(error?.detail || 'Could not load older messages.');
    } finally {
      setIsLoadingOlder(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = messageInput.trim();
    if (!body || !selectedConvId || announcementOnly) return;
    try {
      const message = await sendMessage(selectedConvId, body);
      setMessages((current) => [...current, message]);
      setConversations((current) => current.map((conversation) =>
        conversation.id === selectedConvId
          ? { ...conversation, last_message: message.body, last_message_at: message.created_at }
          : conversation
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
      setMessageInput('');
      setNotice('');
    } catch (error: any) {
      setNotice(error?.detail || 'Message could not be delivered. Check contact permissions and try again.');
    }
  }

  if (!loading && !signedIn) {
    return <div className="cg-page">
      <section className="cg-surface mx-auto max-w-xl space-y-4 p-8 text-center">
        <MessageSquare className="mx-auto text-[var(--cg-accent)]" size={30}/>
        <h1 className="text-2xl font-semibold">Your messages</h1>
        <p className="text-sm cg-muted">Sign in to open conversations and message students who allow contact.</p>
        <Link href="/login" className="btn-campus-amber inline-flex min-h-11 items-center rounded-full px-5">Sign in</Link>
      </section>
    </div>;
  }

  return <div className="cg-page mx-auto max-w-6xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="cg-eyebrow">YOUR CONVERSATIONS</p><h1 className="mt-2 text-3xl font-semibold">Messages</h1><p className="mt-1 text-sm cg-muted">Private conversations and campus community channels.</p></div>
      <Link href="/discover" className="cg-link inline-flex min-h-11 items-center text-sm">Find students <ArrowUpRight size={15} className="ml-1"/></Link>
    </header>
    {notice && <p role="status" className="cg-surface border border-[var(--cg-border)] p-3 text-sm">{notice}</p>}

    <div className="grid min-h-[68vh] gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className={`${showMobileList ? 'flex' : 'hidden'} md:flex cg-surface min-h-[68vh] min-w-0 flex-col overflow-hidden`}>
        <div className="border-b border-[var(--cg-border)] p-4">
          <div className="flex items-center gap-2"><Users size={17} className="text-[var(--cg-accent)]"/><h2 className="font-semibold">Inbox</h2><span className="ml-auto text-xs cg-muted tabular-nums">{conversations.length}</span></div>
          <label className="relative mt-3 block"><span className="sr-only">Search conversations</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 cg-muted"/><input value={conversationSearch} onChange={(event)=>setConversationSearch(event.target.value)} placeholder="Search conversations" className="celestial-input min-h-11 w-full pl-9 pr-3 text-sm"/></label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? <div className="space-y-2 p-2">{[1,2,3,4].map((item)=><div key={item} className="h-16 animate-pulse rounded-xl bg-[var(--cg-elevated)]"/>)}</div>
          : filteredConversations.length ? filteredConversations.map((conversation)=><button key={conversation.id} type="button" onClick={()=>void selectConversation(conversation.id)} aria-pressed={selectedConvId===conversation.id} className={`mb-1 flex min-h-[68px] w-full items-start gap-3 rounded-xl p-3 text-left transition-colors ${selectedConvId===conversation.id?'bg-[var(--cg-elevated)] ring-1 ring-[var(--cg-accent)]':'hover:bg-[var(--cg-elevated)]'}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cg-elevated)] text-[var(--cg-accent)]"><MessageSquare size={17}/></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{conversation.title || 'Conversation'}</span><span className="mt-1 block truncate text-xs cg-muted">{conversation.last_message || conversation.description || 'No messages yet'}</span></span>
            <span className="shrink-0 pt-0.5 text-[10px] cg-muted">{new Date(conversation.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </button>)
          : <div className="space-y-3 p-5 text-center"><MessageSquare size={24} className="mx-auto cg-muted"/><p className="text-sm font-medium">{conversationSearch?'No matching conversations':'No conversations yet'}</p><p className="text-xs cg-muted">Open a student's profile to start a direct conversation, or join a community.</p><Link href="/discover" className="cg-link inline-flex min-h-11 items-center text-sm">Explore students <ArrowUpRight size={14} className="ml-1"/></Link></div>}
        </div>
      </aside>

      <section className={`${showMobileList ? 'hidden' : 'flex'} md:flex cg-surface min-h-[68vh] min-w-0 flex-col overflow-hidden`}>
        {currentConversation ? <>
          <header className="flex flex-wrap items-center gap-3 border-b border-[var(--cg-border)] p-4">
            <button type="button" onClick={()=>setShowMobileList(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-[var(--cg-elevated)] md:hidden" aria-label="Back to inbox"><ArrowLeft size={18}/></button>
            <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{currentConversation.title || 'Conversation'}</h2><p className="mt-0.5 text-xs cg-muted">{currentConversation.conversation_type.replace(/_/g,' ').toLowerCase()}</p></div>
          </header>

          {isGroupConversation && <div className="flex flex-wrap gap-2 border-b border-[var(--cg-border)] px-4 py-2">
            {([{id:'chat',label:'Discussion'},{id:'announcements',label:'Announcements'},{id:'vault',label:'Pinned'}] as const).map((tab)=><button key={tab.id} type="button" aria-pressed={threadTab===tab.id} onClick={()=>setThreadTab(tab.id)} className={`min-h-11 rounded-full px-3 text-xs font-medium ${threadTab===tab.id?'bg-[var(--cg-elevated)] text-[var(--cg-text)]':'cg-muted hover:bg-[var(--cg-elevated)]'}`}>{tab.label}</button>)}
          </div>}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--cg-border)] px-4 py-2">
              <span className="text-xs cg-muted">{filteredMessages.length} messages loaded</span>
              <label className="relative block w-full max-w-xs"><span className="sr-only">Search loaded messages</span><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 cg-muted"/><input value={messageSearch} onChange={(event)=>setMessageSearch(event.target.value)} placeholder="Search loaded messages" className="celestial-input min-h-10 w-full pl-9 pr-3 text-xs"/></label>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {hasMoreMessages && <div className="flex justify-center"><button type="button" onClick={()=>void loadOlderMessages()} disabled={isLoadingOlder} className="min-h-11 rounded-full border border-[var(--cg-border)] px-4 text-xs cg-muted disabled:opacity-50">{isLoadingOlder?'Loading older messages…':'Load older messages'}</button></div>}
              {filteredMessages.length ? filteredMessages.map((message)=><article key={message.id} className={`max-w-[88%] space-y-2 rounded-2xl border p-4 sm:max-w-[75%] ${message.sender_id===myProfile?.user_id?'ml-auto border-[var(--cg-accent)]/30 bg-[var(--cg-elevated)]':'mr-auto border-[var(--cg-border)]'}`}>
                <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{message.sender_name || 'Student'}</p><p className="mt-0.5 text-[10px] cg-muted">@{message.sender_handle || 'student'} · {new Date(message.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p></div><button type="button" onClick={()=>setReportTarget({id:message.id,type:'MESSAGE',title:message.body})} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full cg-muted hover:bg-[var(--cg-elevated)]" aria-label="Report message"><Flag size={14}/></button></div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                {message.is_pinned && <span className="inline-flex items-center gap-1 text-[10px] cg-muted"><Pin size={11}/>Pinned</span>}
              </article>) : <div className="py-12 text-center"><MessageSquare size={24} className="mx-auto cg-muted"/><p className="mt-3 text-sm font-medium">{threadTab==='vault'?'No pinned messages yet':'No messages in this view yet'}</p><p className="mt-1 text-xs cg-muted">Start the conversation when you are ready.</p></div>}
            </div>
          </div>

          {announcementOnly ? <div className="border-t border-[var(--cg-border)] p-4 text-sm cg-muted">Only community owners and moderators can publish official announcements.</div>
          : <form onSubmit={handleSendMessage} className="flex items-end gap-2 border-t border-[var(--cg-border)] p-3 sm:p-4">
            <label className="min-w-0 flex-1"><span className="sr-only">Write a message</span><textarea value={messageInput} onChange={(event)=>setMessageInput(event.target.value)} maxLength={5000} rows={2} placeholder={`Message ${currentConversation.title || 'conversation'}…`} className="celestial-input w-full resize-y px-3 py-2 text-sm"/></label>
            <button type="submit" disabled={!messageInput.trim()} className="btn-campus-amber inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-50"><Send size={15}/><span className="hidden sm:inline">Send</span></button>
          </form>}
        </> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><MessageSquare size={30} className="cg-muted"/><h2 className="mt-4 text-lg font-semibold">Choose a conversation</h2><p className="mt-2 max-w-sm text-sm cg-muted">Select a thread from your inbox, or find a student and start a direct conversation.</p><Link href="/discover" className="cg-link mt-4 inline-flex min-h-11 items-center text-sm">Discover students <ArrowUpRight size={15} className="ml-1"/></Link></div>}
      </section>
    </div>

    {reportTarget && <ReportModal isOpen onClose={()=>setReportTarget(null)} targetType={reportTarget.type} targetId={reportTarget.id} targetTitle={reportTarget.title}/>}
  </div>;
}

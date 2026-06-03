'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { getUsersListWithUnread, getMessagesForAdminWithUser, sendAdminToUserMessage, markUserMessagesAsRead } from '@/app/actions/user-message-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { 
  Send, 
  Paperclip, 
  Loader2, 
  RefreshCw, 
  UserCheck, 
  Check, 
  CheckCheck, 
  FileText, 
  Download,
  Search,
  User,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'freelancer';
  unreadCount: number;
  latestMessageText: string;
  latestMessageTime: Date | null;
}

interface Message {
  id: number;
  senderId: string;
  senderType: 'user' | 'admin';
  receiverId: string;
  receiverType: 'user' | 'admin';
  message: string;
  attachmentUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminUsersMessagesPage() {
  const [usersList, setUsersList] = useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [inputText, setInputText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, startSendingTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users list with unread counts
  const fetchUsers = async (showLoader = false) => {
    if (showLoader) setIsUsersLoading(true);
    try {
      const data = await getUsersListWithUnread();
      setUsersList(data as any);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      if (showLoader) setIsUsersLoading(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (userId: string, showLoader = false) => {
    if (showLoader) setIsMessagesLoading(true);
    try {
      const data = await getMessagesForAdminWithUser(userId);
      setMessages(data as Message[]);

      // Mark unread messages from this user as read
      const unreadFromUser = data.filter(m => m.senderType === 'user' && !m.isRead);
      if (unreadFromUser.length > 0) {
        await markUserMessagesAsRead(userId, 'user');
        // Refresh list counts
        fetchUsers(false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      if (showLoader) setIsMessagesLoading(false);
    }
  };

  // Poll background refresh
  useEffect(() => {
    fetchUsers(true);
    const interval = setInterval(() => {
      fetchUsers(false);
      if (selectedUserId) {
        fetchMessages(selectedUserId, false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setMessages([]);
    setInputText('');
    setAttachmentUrl('');
    setShowAttachmentInput(false);
    fetchMessages(userId, true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    if (!inputText.trim() && !attachmentUrl.trim()) return;

    const msg = inputText;
    const att = attachmentUrl;

    setInputText('');
    setAttachmentUrl('');
    setShowAttachmentInput(false);

    startSendingTransition(async () => {
      try {
        await sendAdminToUserMessage(selectedUserId, msg, att || undefined);
        await fetchMessages(selectedUserId, false);
        await fetchUsers(false);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    });
  };

  // Filter users list
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || 
             u.email.toLowerCase().includes(q) || 
             u.role.toLowerCase().includes(q);
    });
  }, [usersList, searchQuery]);

  const activeUser = useMemo(() => {
    return usersList.find(u => u.id === selectedUserId);
  }, [usersList, selectedUserId]);

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 overflow-hidden shadow-xl">
      
      {/* Left Panel */}
      <div className="w-80 border-r border-slate-100 dark:border-zinc-800/80 flex flex-col h-full bg-slate-50/40 dark:bg-zinc-900/10">
        
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Users & Freelancers</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchUsers(true)}
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              disabled={isUsersLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isUsersLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-slate-100 dark:bg-zinc-900 border-transparent rounded-xl text-xs h-9 focus-visible:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/40 p-2 space-y-1">
          {isUsersLoading && usersList.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
              No users or freelancers found.
            </div>
          ) : (
            filteredUsers.map(u => {
              const isSelected = u.id === selectedUserId;
              const isFreelancer = u.role === 'freelancer';
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex gap-3 items-start ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                      : 'hover:bg-slate-100/80 dark:hover:bg-zinc-900/60 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <Avatar className="h-9 w-9 rounded-xl shrink-0 border border-slate-200/50 dark:border-zinc-800">
                    <AvatarFallback className={isSelected ? "bg-white/20 text-white font-bold text-xs" : isFreelancer ? "bg-purple-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 font-bold text-xs" : "bg-sky-100 dark:bg-zinc-800 text-sky-600 dark:text-sky-400 font-bold text-xs"}>
                      {isFreelancer ? <Sparkles className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold truncate leading-none">{u.name}</p>
                      {u.latestMessageTime && (
                        <span className={`text-[9px] font-medium shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {format(new Date(u.latestMessageTime), 'dd MMM')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[10px] truncate leading-normal flex-1 ${isSelected ? 'text-white/85' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {u.latestMessageText || 'No messages yet'}
                      </p>
                      <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : isFreelancer 
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                          : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      }`}>
                        {u.role === 'freelancer' ? 'Creator' : 'Client'}
                      </span>
                    </div>
                  </div>
                  {u.unreadCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[9px] font-black rounded-full bg-rose-500 text-white shrink-0 animate-pulse">
                      {u.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Chat Room */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-zinc-950/20">
        {activeUser ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/60 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-850">
                  <AvatarFallback className="bg-indigo-600 text-white font-bold text-xs">
                    {activeUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{activeUser.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">{activeUser.email} • Role: <span className="capitalize">{activeUser.role}</span></p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchMessages(activeUser.id, true)} 
                className="rounded-xl border-slate-200 text-[10px] font-extrabold uppercase gap-1 px-3 py-1.5"
                disabled={isMessagesLoading}
              >
                {isMessagesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Sync
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-slate-50/40 dark:bg-zinc-950/10">
              {isMessagesLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                  <MessageSquare className="h-10 w-10 text-slate-300 dark:text-zinc-800 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">Start the conversation</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Send a message to user partner to assist them.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderType === 'admin';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                      <div className={`flex items-start gap-2.5 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <AvatarFallback className={isMe ? "bg-indigo-600 text-white font-bold text-[10px]" : "bg-slate-900 text-white font-bold text-[10px]"}>
                            {isMe ? 'AD' : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                              {isMe ? 'You (Admin)' : activeUser.name}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {format(new Date(m.createdAt), 'hh:mm a')}
                            </span>
                          </div>
                          <div className={`rounded-2xl px-4 py-2 text-xs font-medium shadow-sm transition-all duration-200 ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-tl-none border border-slate-100 dark:border-zinc-800/80'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                            
                            {m.attachmentUrl && (
                              <div className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-3 text-[9px] ${
                                isMe ? 'border-white/10 text-white/95' : 'border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                              }`}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="h-3 w-3 shrink-0" />
                                  <span className="truncate max-w-[120px]">{m.attachmentUrl.split('/').pop()}</span>
                                </div>
                                <a 
                                  href={m.attachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-0.5 font-bold underline hover:opacity-80 shrink-0"
                                >
                                  <Download className="h-2.5 w-2.5" /> View
                                </a>
                              </div>
                            )}
                          </div>
                          {isMe && (
                            <div className="flex justify-end items-center gap-1 mt-0.5 text-slate-400 dark:text-zinc-500">
                              {m.isRead ? (
                                <CheckCheck className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              <span className="text-[8px] font-bold uppercase">{m.isRead ? 'Read' : 'Sent'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800/60 shrink-0">
              {showAttachmentInput && (
                <div className="mb-3 p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
                  <Paperclip className="h-4 w-4 text-indigo-500 shrink-0" />
                  <Input 
                    placeholder="Attachment file URL..." 
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="bg-white dark:bg-zinc-900 border-slate-200 text-xs rounded-xl h-9 flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setAttachmentUrl(''); setShowAttachmentInput(false); }}
                    className="text-xs text-rose-500 hover:text-rose-600 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                  className={`h-10 w-10 rounded-xl shrink-0 transition-colors ${showAttachmentInput ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' : 'border-slate-200'}`}
                  title="Attach file URL"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input 
                  placeholder={`Send message to ${activeUser.name}...`} 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSending}
                  className="flex-1 bg-slate-50 dark:bg-zinc-950 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50 rounded-xl h-10 text-xs"
                />

                <Button 
                  type="submit" 
                  disabled={isSending || (!inputText.trim() && !attachmentUrl.trim())}
                  className="h-10 px-4 rounded-xl shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold gap-1.5 text-xs shadow-md shadow-indigo-600/20"
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="h-14 w-14 rounded-3xl bg-indigo-50 dark:bg-zinc-900 flex items-center justify-center text-indigo-500 mb-4 border border-indigo-100/50 dark:border-zinc-800">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Select a User or Creator</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Choose a client customer or freelance creator from the sidebar to view unread messages, discuss orders, or resolve payouts.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

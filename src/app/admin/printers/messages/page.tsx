'use client';

import React, { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import { getPrintersListWithUnread, getMessagesForAdmin, sendAdminMessage, markMessagesAsRead } from '@/app/actions/message-actions';
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
  ShieldAlert, 
  Check, 
  CheckCheck, 
  FileText, 
  Download,
  Search,
  Factory,
  MessageSquare,
  Dot
} from 'lucide-react';

interface PrinterListItem {
  id: string;
  companyName: string;
  fullName: string;
  email: string;
  status: string;
  unreadCount: number;
  latestMessageText: string;
  latestMessageTime: Date | null;
}

interface Message {
  id: number;
  senderId: string;
  senderType: 'printer' | 'admin';
  receiverId: string;
  receiverType: 'printer' | 'admin';
  message: string;
  attachmentUrl: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminPrintersMessagesPage() {
  const [printers, setPrinters] = useState<PrinterListItem[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [inputText, setInputText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  
  const [isPrintersLoading, setIsPrintersLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, startSendingTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch printers list with unread counts
  const fetchPrinters = async (showLoader = false) => {
    if (showLoader) setIsPrintersLoading(true);
    try {
      const data = await getPrintersListWithUnread();
      setPrinters(data as any);
    } catch (error) {
      console.error('Failed to fetch printers:', error);
    } finally {
      if (showLoader) setIsPrintersLoading(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (printerId: string, showLoader = false) => {
    if (showLoader) setIsMessagesLoading(true);
    try {
      const data = await getMessagesForAdmin(printerId);
      setMessages(data as Message[]);

      // Mark unread messages from this printer as read
      const unreadFromPrinter = data.filter(m => m.senderType === 'printer' && !m.isRead);
      if (unreadFromPrinter.length > 0) {
        await markMessagesAsRead(printerId, 'printer');
        // Refresh printers list count
        fetchPrinters(false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      if (showLoader) setIsMessagesLoading(false);
    }
  };

  // Initial loads and background refresh poll
  useEffect(() => {
    fetchPrinters(true);
    const interval = setInterval(() => {
      fetchPrinters(false);
      if (selectedPrinterId) {
        fetchMessages(selectedPrinterId, false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedPrinterId]);

  // Load conversation when printer is selected
  const handleSelectPrinter = (printerId: string) => {
    setSelectedPrinterId(printerId);
    setMessages([]);
    setInputText('');
    setAttachmentUrl('');
    setShowAttachmentInput(false);
    fetchMessages(printerId, true);
  };

  // Scroll active window to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrinterId) return;
    if (!inputText.trim() && !attachmentUrl.trim()) return;

    const msg = inputText;
    const att = attachmentUrl;

    setInputText('');
    setAttachmentUrl('');
    setShowAttachmentInput(false);

    startSendingTransition(async () => {
      try {
        await sendAdminMessage(selectedPrinterId, msg, att || undefined);
        await fetchMessages(selectedPrinterId, false);
        await fetchPrinters(false);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    });
  };

  // Filter printers list
  const filteredPrinters = useMemo(() => {
    return printers.filter(p => {
      const q = searchQuery.toLowerCase();
      return p.companyName.toLowerCase().includes(q) || 
             p.fullName.toLowerCase().includes(q) || 
             p.email.toLowerCase().includes(q);
    });
  }, [printers, searchQuery]);

  const activePrinter = useMemo(() => {
    return printers.find(p => p.id === selectedPrinterId);
  }, [printers, selectedPrinterId]);

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 overflow-hidden shadow-xl">
      
      {/* Left panel: Printers list */}
      <div className="w-80 border-r border-slate-100 dark:border-zinc-800/80 flex flex-col h-full bg-slate-50/40 dark:bg-zinc-900/10">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Printers Chat</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchPrinters(true)}
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-600"
              disabled={isPrintersLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPrintersLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search print hubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-slate-100 dark:bg-zinc-900 border-transparent rounded-xl text-xs h-9 focus-visible:ring-blue-500/20"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/40 p-2 space-y-1">
          {isPrintersLoading && printers.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : filteredPrinters.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
              No print hubs found.
            </div>
          ) : (
            filteredPrinters.map(p => {
              const isSelected = p.id === selectedPrinterId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrinter(p.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex gap-3 items-start ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'hover:bg-slate-100/80 dark:hover:bg-zinc-900/60 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <Avatar className="h-9 w-9 rounded-xl shrink-0 border border-slate-200/50 dark:border-zinc-800">
                    <AvatarFallback className={isSelected ? "bg-white/20 text-white font-bold text-xs" : "bg-blue-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold text-xs"}>
                      <Factory className="h-4.5 w-4.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold truncate leading-none">{p.companyName}</p>
                      {p.latestMessageTime && (
                        <span className={`text-[9px] font-medium shrink-0 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {format(new Date(p.latestMessageTime), 'dd MMM')}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] truncate leading-normal ${isSelected ? 'text-white/85' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {p.latestMessageText || 'No messages yet'}
                    </p>
                  </div>
                  {p.unreadCount > 0 && (
                    <span className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[9px] font-black rounded-full bg-rose-500 text-white shrink-0 animate-pulse">
                      {p.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Active chat window */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/20 dark:bg-zinc-950/20">
        {activePrinter ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/60 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 rounded-xl border border-slate-200 dark:border-zinc-850">
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                    {activePrinter.companyName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{activePrinter.companyName}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">{activePrinter.email} • Status: <span className="capitalize">{activePrinter.status}</span></p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchMessages(activePrinter.id, true)} 
                className="rounded-xl border-slate-200 text-[10px] font-extrabold uppercase gap-1 px-3 py-1.5"
                disabled={isMessagesLoading}
              >
                {isMessagesLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Sync
              </Button>
            </div>

            {/* Conversation view */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-slate-50/40 dark:bg-zinc-950/10">
              {isMessagesLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                  <MessageSquare className="h-10 w-10 text-slate-300 dark:text-zinc-800 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">Start the conversation</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Send a message to print hub partner to assist them.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderType === 'admin';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                      <div className={`flex items-start gap-2.5 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-zinc-800 shadow-sm">
                          <AvatarFallback className={isMe ? "bg-blue-600 text-white font-bold text-[10px]" : "bg-slate-900 text-white font-bold text-[10px]"}>
                            {isMe ? 'AD' : 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                              {isMe ? 'You (Admin)' : activePrinter.companyName}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {format(new Date(m.createdAt), 'hh:mm a')}
                            </span>
                          </div>
                          <div className={`rounded-2xl px-4 py-2 text-xs font-medium shadow-sm transition-all duration-200 ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
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

            {/* Input Panel */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800/60 shrink-0">
              {showAttachmentInput && (
                <div className="mb-3 p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
                  <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
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
                  className={`h-10 w-10 rounded-xl shrink-0 transition-colors ${showAttachmentInput ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' : 'border-slate-200'}`}
                  title="Attach file URL"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input 
                  placeholder={`Send message to ${activePrinter.companyName}...`} 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSending}
                  className="flex-1 bg-slate-50 dark:bg-zinc-950 border-slate-200 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 rounded-xl h-10 text-xs"
                />

                <Button 
                  type="submit" 
                  disabled={isSending || (!inputText.trim() && !attachmentUrl.trim())}
                  className="h-10 px-4 rounded-xl shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-1.5 text-xs shadow-md shadow-blue-600/20"
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
            <div className="h-14 w-14 rounded-3xl bg-blue-50 dark:bg-zinc-900 flex items-center justify-center text-blue-500 mb-4 border border-blue-100/50 dark:border-zinc-800">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-widest">Select a Print Hub</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Choose a printer partner from the sidebar to view unread messages, discuss production orders, or resolve delivery inquiries.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

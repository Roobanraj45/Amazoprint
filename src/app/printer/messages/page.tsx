'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { getMessagesForPrinter, sendPrinterMessage, markMessagesAsRead } from '@/app/actions/message-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Send, Paperclip, Loader2, RefreshCw, ShieldAlert, Check, CheckCheck, FileText, Download } from 'lucide-react';

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

export default function PrinterMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, startSendingTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await getMessagesForPrinter();
      setMessages(data as Message[]);
      
      // Find any unread admin messages and mark them as read
      const unreadAdminMessages = data.filter(m => m.senderType === 'admin' && !m.isRead);
      if (unreadAdminMessages.length > 0) {
        // Assume first sender ID from admin or just perform read mark
        const adminSender = unreadAdminMessages[0].senderId;
        await markMessagesAsRead(adminSender, 'admin');
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachmentUrl.trim()) return;

    const messageText = inputText;
    const currentAttachment = attachmentUrl;

    setInputText('');
    setAttachmentUrl('');
    setShowAttachmentInput(false);

    startSendingTransition(async () => {
      try {
        await sendPrinterMessage(messageText, currentAttachment || undefined);
        await fetchMessages(false);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto bg-slate-50 dark:bg-zinc-950 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/60 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Amazoprint Helpdesk</h2>
            <p className="text-[10px] text-slate-400 font-bold">Direct line with administrator & operations desk</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchMessages(true)} 
          className="rounded-xl border-slate-200 text-xs font-bold gap-1 px-3"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Message List area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-slate-50/50 dark:bg-zinc-950/20">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 dark:text-zinc-500 max-w-sm mx-auto">
            <ShieldAlert className="h-12 w-12 text-slate-300 dark:text-zinc-700 mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">No Messages Yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Start a conversation with administrators. Send a message below to report order issues, shipment delays, or payout inquiries.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderType === 'printer';
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`flex items-start gap-2.5 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <AvatarFallback className={isMe ? "bg-slate-900 text-white font-bold text-xs" : "bg-emerald-500 text-white font-bold text-xs"}>
                      {isMe ? 'P' : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        {isMe ? 'Printer Hub (You)' : 'Amazoprint Admin'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {format(new Date(m.createdAt), 'hh:mm a')}
                      </span>
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm transition-all duration-200 ${
                      isMe 
                        ? 'bg-slate-900 dark:bg-zinc-850 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-tl-none border border-slate-100 dark:border-zinc-800/80'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      
                      {m.attachmentUrl && (
                        <div className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-3 text-[10px] ${
                          isMe ? 'border-white/10 text-white/95' : 'border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{m.attachmentUrl.split('/').pop()}</span>
                          </div>
                          <a 
                            href={m.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 font-bold underline hover:opacity-80 shrink-0`}
                          >
                            <Download className="h-3 w-3" /> View
                          </a>
                        </div>
                      )}
                    </div>
                    {isMe && (
                      <div className="flex justify-end items-center gap-1 mt-0.5 text-slate-400 dark:text-zinc-500">
                        {m.isRead ? (
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[9px] font-bold uppercase">{m.isRead ? 'Read' : 'Sent'}</span>
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

      {/* Input row */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800/60 shrink-0">
        {showAttachmentInput && (
          <div className="mb-3 p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
            <Paperclip className="h-4 w-4 text-emerald-500 shrink-0" />
            <Input 
              placeholder="Paste attachment URL here (e.g. image, proof, pdf link)" 
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
            className={`h-10 w-10 rounded-xl shrink-0 transition-colors ${showAttachmentInput ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'border-slate-200'}`}
            title="Attach file URL"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input 
            placeholder="Type your message to administration..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-slate-50 dark:bg-zinc-950 border-slate-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50 rounded-xl h-10 text-xs"
          />

          <Button 
            type="submit" 
            disabled={isSending || (!inputText.trim() && !attachmentUrl.trim())}
            className="h-10 px-4 rounded-xl shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-1.5 text-xs shadow-md shadow-emerald-600/20"
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
    </div>
  );
}

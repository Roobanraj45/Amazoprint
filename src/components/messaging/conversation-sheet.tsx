'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { getConversation, sendMessage, markConversationAsRead } from '@/app/actions/message-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Clock, Check, CheckCheck } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

type User = {
    id: string;
    name: string | null;
    profileImage?: string | null;
}

type Message = Awaited<ReturnType<typeof getConversation>>[0];

export function ConversationSheet({
    contestId,
    client,
    freelancer,
    currentUser,
    children,
}: {
    contestId: number;
    client: User;
    freelancer: User;
    currentUser: User;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isPending, startTransition] = useTransition();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const otherUser = currentUser.id === client.id ? freelancer : client;
    
    useEffect(() => {
        if (isOpen) {
            const fetchAndMarkRead = async () => {
                setIsLoading(true);
                try {
                    await markConversationAsRead(contestId, freelancer.id);
                    const fetchedMessages = await getConversation(contestId, freelancer.id);
                    setMessages(fetchedMessages);
                } catch (error) {
                    console.error("Failed to fetch conversation or mark as read", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAndMarkRead();
        }
    }, [isOpen, contestId, freelancer.id]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const formData = new FormData();
        formData.append('contestId', String(contestId));
        formData.append('receiverId', otherUser.id);
        formData.append('freelancerId', freelancer.id);
        formData.append('message', newMessage);

        startTransition(async () => {
            const optimisticMessage: Message = {
                id: 0, // temp id for optimistic update
                message: newMessage,
                senderId: currentUser.id,
                sender: { id: currentUser.id, name: currentUser.name, profileImage: currentUser.profileImage || null },
                createdAt: new Date(),
                contestId,
                receiverId: otherUser.id,
                freelancerId: freelancer.id,
                attachmentUrl: null,
                isRead: false
            };
            setMessages(prev => [...prev, optimisticMessage]);
            setNewMessage('');
            
            await sendMessage(formData);
            
            // Re-fetch to get actual data from server
            const fetchedMessages = await getConversation(contestId, freelancer.id);
            setMessages(fetchedMessages);
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>Conversation with {otherUser.name}</SheetTitle>
                    <SheetDescription>Discussing your submission for the contest.</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2 py-4">
                                {messages.map((msg, index) => {
                                    const isSender = msg.senderId === currentUser.id;
                                    const userForAvatar = isSender ? currentUser : msg.sender;
                                    const prevMessage = messages[index - 1];
                                    const showHeader = !prevMessage || prevMessage.senderId !== msg.senderId || differenceInMinutes(new Date(msg.createdAt), new Date(prevMessage.createdAt)) > 5;

                                    return (
                                        <div 
                                          key={msg.id || `optimistic-${index}`}
                                          className={cn(
                                            "flex w-full items-start gap-3",
                                            isSender && 'ml-auto flex-row-reverse',
                                            showHeader && "mt-4"
                                          )}
                                        >
                                           <Avatar className={cn("h-8 w-8", showHeader ? 'visible' : 'invisible')}>
                                                <AvatarImage src={userForAvatar?.profileImage || undefined} />
                                                <AvatarFallback>{userForAvatar?.name?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className={cn("flex flex-col gap-1 w-full max-w-[75%]", isSender && "items-end")}>
                                                {showHeader && <p className="text-xs font-semibold px-1">{userForAvatar.name}</p>}
                                                <div className={cn(
                                                    "break-words rounded-xl p-3",
                                                    isSender ? "rounded-br-none bg-primary text-primary-foreground" : "rounded-bl-none bg-secondary"
                                                )}>
                                                    <p className="text-sm">{msg.message}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(msg.createdAt), 'p')}
                                                    </span>
                                                    {isSender && msg.id === 0 && <Clock className="h-3 w-3 text-muted-foreground" />}
                                                    {isSender && msg.id !== 0 && !msg.isRead && <Check className="h-3 w-3 text-muted-foreground" />}
                                                    {isSender && msg.id !== 0 && msg.isRead && <CheckCheck className="h-3 w-3 text-primary" />}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </div>
                <SheetFooter>
                    <form onSubmit={handleSendMessage} className="flex w-full items-start gap-2">
                        <Textarea
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1"
                            rows={2}
                            disabled={isPending}
                        />
                        <Button type="submit" disabled={isPending || !newMessage.trim()}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send
                        </Button>
                    </form>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

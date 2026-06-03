'use server';

import { db } from '@/db';
import { printersMessaging, printPressUsers, admins } from '@/db/schema';
import { and, eq, or, desc, asc, count, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to check admin access
async function verifyAdminSession() {
  const session = await getSession();
  const adminRoles = ['admin', 'super_admin', 'company_admin', 'designer', 'accounts', 'printer'];
  if (!session?.sub || !adminRoles.includes(session.role)) {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

// Helper to check printer access
async function verifyPrinterSession() {
  const session = await getSession();
  if (!session?.sub || session.role !== 'printer') {
    throw new Error('Unauthorized: Printer access required');
  }
  return session;
}

/**
 * Sends a message from a printer to admins.
 */
export async function sendPrinterMessage(messageText: string, attachmentUrl?: string) {
  const session = await verifyPrinterSession();
  const printerId = session.sub;

  // We find an admin receiver. Usually messages are broadcast or sent to the main admin entity,
  // but to maintain schema structure, we can find a primary/company admin or just default to a placeholder admin ID.
  // Let's find any active admin to associate it as a receiver, or if none, throw error or set receiverId to a dummy uuid.
  const mainAdmin = await db.query.admins.findFirst({
    where: eq(admins.isActive, true),
  });

  const receiverId = mainAdmin?.id || '00000000-0000-0000-0000-000000000000';

  const [newMessage] = await db.insert(printersMessaging)
    .values({
      senderId: printerId,
      senderType: 'printer',
      receiverId: receiverId,
      receiverType: 'admin',
      message: messageText,
      attachmentUrl: attachmentUrl || null,
      isRead: false,
    })
    .returning();

  revalidatePath('/printer/messages');
  revalidatePath('/admin/printers/messages');
  return newMessage;
}

/**
 * Sends a message from an admin to a specific printer.
 */
export async function sendAdminMessage(printerId: string, messageText: string, attachmentUrl?: string) {
  const session = await verifyAdminSession();
  const adminId = session.sub;

  const [newMessage] = await db.insert(printersMessaging)
    .values({
      senderId: adminId,
      senderType: 'admin',
      receiverId: printerId,
      receiverType: 'printer',
      message: messageText,
      attachmentUrl: attachmentUrl || null,
      isRead: false,
    })
    .returning();

  revalidatePath('/printer/messages');
  revalidatePath('/admin/printers/messages');
  return newMessage;
}

/**
 * Gets message history between an admin and a specific printer.
 */
export async function getMessagesForAdmin(printerId: string) {
  await verifyAdminSession();

  // Find all messages where:
  // (senderId = printerId AND senderType = 'printer') OR (receiverId = printerId AND receiverType = 'printer')
  const messages = await db.query.printersMessaging.findMany({
    where: or(
      and(
        eq(printersMessaging.senderId, printerId),
        eq(printersMessaging.senderType, 'printer')
      ),
      and(
        eq(printersMessaging.receiverId, printerId),
        eq(printersMessaging.receiverType, 'printer')
      )
    ),
    orderBy: [asc(printersMessaging.createdAt)],
  });

  return messages;
}

/**
 * Gets message history for the logged-in printer.
 */
export async function getMessagesForPrinter() {
  const session = await verifyPrinterSession();
  const printerId = session.sub;

  const messages = await db.query.printersMessaging.findMany({
    where: or(
      and(
        eq(printersMessaging.senderId, printerId),
        eq(printersMessaging.senderType, 'printer')
      ),
      and(
        eq(printersMessaging.receiverId, printerId),
        eq(printersMessaging.receiverType, 'printer')
      )
    ),
    orderBy: [asc(printersMessaging.createdAt)],
  });

  return messages;
}

/**
 * Marks messages as read.
 */
export async function markMessagesAsRead(senderId: string, senderType: 'printer' | 'admin') {
  const session = await getSession();
  if (!session?.sub) throw new Error('Unauthorized');

  // Mark all messages sent by `senderId` (with senderType) to the current user as read
  await db.update(printersMessaging)
    .set({ isRead: true })
    .where(
      and(
        eq(printersMessaging.senderId, senderId),
        eq(printersMessaging.senderType, senderType),
        eq(printersMessaging.receiverId, session.sub),
        eq(printersMessaging.isRead, false)
      )
    );

  revalidatePath('/printer/messages');
  revalidatePath('/admin/printers/messages');
  return { success: true };
}

/**
 * Retrieves the list of printers with their latest message and unread counts for the admin side.
 */
export async function getPrintersListWithUnread() {
  await verifyAdminSession();

  // 1. Get all active printer users
  const printersList = await db.query.printPressUsers.findMany({
    where: eq(printPressUsers.isActive, true),
    columns: {
      id: true,
      companyName: true,
      fullName: true,
      email: true,
      status: true,
    }
  });

  // 2. Fetch unread counts and latest messages
  const result = await Promise.all(printersList.map(async (printer) => {
    // Unread count: messages sent by this printer that are unread
    const [unreadCountResult] = await db
      .select({ count: count() })
      .from(printersMessaging)
      .where(
        and(
          eq(printersMessaging.senderId, printer.id),
          eq(printersMessaging.senderType, 'printer'),
          eq(printersMessaging.isRead, false)
        )
      );

    // Latest message
    const latestMessage = await db.query.printersMessaging.findFirst({
      where: or(
        and(
          eq(printersMessaging.senderId, printer.id),
          eq(printersMessaging.senderType, 'printer')
        ),
        and(
          eq(printersMessaging.receiverId, printer.id),
          eq(printersMessaging.receiverType, 'printer')
        )
      ),
      orderBy: [desc(printersMessaging.createdAt)],
    });

    return {
      id: printer.id,
      companyName: printer.companyName || printer.fullName,
      fullName: printer.fullName,
      email: printer.email,
      status: printer.status,
      unreadCount: unreadCountResult?.count || 0,
      latestMessageText: latestMessage?.message || '',
      latestMessageTime: latestMessage?.createdAt || null,
    };
  }));

  // Sort by latest message time, newest first
  return result.sort((a, b) => {
    if (!a.latestMessageTime) return 1;
    if (!b.latestMessageTime) return -1;
    return b.latestMessageTime.getTime() - a.latestMessageTime.getTime();
  });
}

/**
 * Returns the total unread message count for the current session user.
 */
export async function getUnreadMessageCount() {
  const session = await getSession();
  if (!session?.sub) return 0;

  const [unreadCountResult] = await db
    .select({ count: count() })
    .from(printersMessaging)
    .where(
      and(
        eq(printersMessaging.receiverId, session.sub),
        eq(printersMessaging.isRead, false)
      )
    );

  return unreadCountResult?.count || 0;
}


'use server';

import { db } from '@/db';
import { usersMessaging, users, admins } from '@/db/schema';
import { and, eq, or, desc, asc, count } from 'drizzle-orm';
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

// Helper to check user session (roles: user or freelancer)
async function verifyUserSession() {
  const session = await getSession();
  if (!session?.sub || !['user', 'freelancer'].includes(session.role)) {
    throw new Error('Unauthorized: User access required');
  }
  return session;
}

/**
 * Sends a message from a user/freelancer to admins.
 */
export async function sendUserMessage(messageText: string, attachmentUrl?: string) {
  const session = await verifyUserSession();
  const userId = session.sub;

  const mainAdmin = await db.query.admins.findFirst({
    where: eq(admins.isActive, true),
  });

  const receiverId = mainAdmin?.id || '00000000-0000-0000-0000-000000000000';

  const [newMessage] = await db.insert(usersMessaging)
    .values({
      senderId: userId,
      senderType: 'user',
      receiverId: receiverId,
      receiverType: 'admin',
      message: messageText,
      attachmentUrl: attachmentUrl || null,
      isRead: false,
    })
    .returning();

  revalidatePath('/client/messages');
  revalidatePath('/freelancer/messages');
  revalidatePath('/admin/users/messages');
  return newMessage;
}

/**
 * Sends a message from an admin to a specific user/freelancer.
 */
export async function sendAdminToUserMessage(userId: string, messageText: string, attachmentUrl?: string) {
  const session = await verifyAdminSession();
  const adminId = session.sub;

  const [newMessage] = await db.insert(usersMessaging)
    .values({
      senderId: adminId,
      senderType: 'admin',
      receiverId: userId,
      receiverType: 'user',
      message: messageText,
      attachmentUrl: attachmentUrl || null,
      isRead: false,
    })
    .returning();

  revalidatePath('/client/messages');
  revalidatePath('/freelancer/messages');
  revalidatePath('/admin/users/messages');
  return newMessage;
}

/**
 * Gets message history between an admin and a specific user.
 */
export async function getMessagesForAdminWithUser(userId: string) {
  await verifyAdminSession();

  const messages = await db.query.usersMessaging.findMany({
    where: or(
      and(
        eq(usersMessaging.senderId, userId),
        eq(usersMessaging.senderType, 'user')
      ),
      and(
        eq(usersMessaging.receiverId, userId),
        eq(usersMessaging.receiverType, 'user')
      )
    ),
    orderBy: [asc(usersMessaging.createdAt)],
  });

  return messages;
}

/**
 * Gets message history for the logged-in user.
 */
export async function getMessagesForUser() {
  const session = await getSession();
  if (!session?.sub || !['user', 'freelancer'].includes(session.role)) {
    return [];
  }
  const userId = session.sub;

  const messages = await db.query.usersMessaging.findMany({
    where: or(
      and(
        eq(usersMessaging.senderId, userId),
        eq(usersMessaging.senderType, 'user')
      ),
      and(
        eq(usersMessaging.receiverId, userId),
        eq(usersMessaging.receiverType, 'user')
      )
    ),
    orderBy: [asc(usersMessaging.createdAt)],
  });

  return messages;
}

/**
 * Marks user messages as read.
 */
export async function markUserMessagesAsRead(senderId: string, senderType: 'user' | 'admin') {
  const session = await getSession();
  if (!session?.sub) throw new Error('Unauthorized');

  await db.update(usersMessaging)
    .set({ isRead: true })
    .where(
      and(
        eq(usersMessaging.senderId, senderId),
        eq(usersMessaging.senderType, senderType),
        eq(usersMessaging.receiverId, session.sub),
        eq(usersMessaging.isRead, false)
      )
    );

  revalidatePath('/client/messages');
  revalidatePath('/freelancer/messages');
  revalidatePath('/admin/users/messages');
  return { success: true };
}

/**
 * Retrieves the total unread message count for the current session user/admin.
 */
export async function getUnreadUserMessageCount() {
  const session = await getSession();
  if (!session?.sub) return 0;

  const [unreadCountResult] = await db
    .select({ count: count() })
    .from(usersMessaging)
    .where(
      and(
        eq(usersMessaging.receiverId, session.sub),
        eq(usersMessaging.isRead, false)
      )
    );

  return unreadCountResult?.count || 0;
}

/**
 * Retrieves the list of users and freelancers with their latest message and unread counts for the admin side.
 */
export async function getUsersListWithUnread() {
  await verifyAdminSession();

  const usersList = await db.query.users.findMany({
    where: eq(users.isActive, true),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });

  const result = await Promise.all(usersList.map(async (user) => {
    // Unread count: messages sent by this user that are unread
    const [unreadCountResult] = await db
      .select({ count: count() })
      .from(usersMessaging)
      .where(
        and(
          eq(usersMessaging.senderId, user.id),
          eq(usersMessaging.senderType, 'user'),
          eq(usersMessaging.isRead, false)
        )
      );

    // Latest message
    const latestMessage = await db.query.usersMessaging.findFirst({
      where: or(
        and(
          eq(usersMessaging.senderId, user.id),
          eq(usersMessaging.senderType, 'user')
        ),
        and(
          eq(usersMessaging.receiverId, user.id),
          eq(usersMessaging.receiverType, 'user')
        )
      ),
      orderBy: [desc(usersMessaging.createdAt)],
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role, // 'user' (client) or 'freelancer'
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

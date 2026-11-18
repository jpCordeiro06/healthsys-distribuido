import { request } from '../api'
import type {
  Notification,
  NotificationChannel,
  NotificationChannelInput,
  NotificationFilter,
  NotificationInput,
  NotificationsService,
} from '../types'

export function createNotificationsService(token: string): NotificationsService {
  return {
    listNotifications: async (filter?: NotificationFilter, signal?: AbortSignal) => {
      const params = new URLSearchParams()
      if (filter?.receiverId) params.append('receiverId', filter.receiverId)
      if (filter?.senderId) params.append('senderId', filter.senderId)
      if (filter?.isRead !== undefined) params.append('isRead', String(filter.isRead))
      if (filter?.isUrgent !== undefined) params.append('isUrgent', String(filter.isUrgent))
      if (filter?.type) params.append('type', filter.type)
      if (filter?.channelId) params.append('channelId', filter.channelId)

      const query = params.toString() ? `?${params.toString()}` : ''
      return await request<Notification[]>(`/notifications${query}`, { signal }, token)
    },

    getNotification: (id: string, signal?: AbortSignal) =>
      request<Notification>(`/notifications/${encodeURIComponent(id)}`, { signal }, token),

    getUnreadCount: async (receiverId: string, signal?: AbortSignal) => {
      const res = await request<{ count: number }>(
        `/notifications/unread-count?receiverId=${encodeURIComponent(receiverId)}`,
        { signal },
        token,
      )
      return res.count
    },

    createNotification: (data: NotificationInput) =>
      request<Notification>(
        '/notifications',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token,
      ),

    markAsRead: (id: string) =>
      request<Notification>(
        `/notifications/${encodeURIComponent(id)}/read`,
        {
          method: 'PATCH',
        },
        token,
      ),

    markAsUnread: (id: string) =>
      request<Notification>(
        `/notifications/${encodeURIComponent(id)}/unread`,
        {
          method: 'PATCH',
        },
        token,
      ),

    deleteNotification: (id: string) =>
      request<void>(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),

    listChannels: async (active?: boolean, signal?: AbortSignal) => {
      const query = active !== undefined ? `?active=${active}` : ''
      return await request<NotificationChannel[]>(`/notification-channels${query}`, { signal }, token)
    },

    getChannel: (id: string, signal?: AbortSignal) =>
      request<NotificationChannel>(`/notification-channels/${encodeURIComponent(id)}`, { signal }, token),

    createChannel: (data: NotificationChannelInput) =>
      request<NotificationChannel>(
        '/notification-channels',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token,
      ),

    updateChannel: (id: string, data: NotificationChannelInput) =>
      request<NotificationChannel>(
        `/notification-channels/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        token,
      ),

    deleteChannel: (id: string) =>
      request<void>(`/notification-channels/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
  }
}

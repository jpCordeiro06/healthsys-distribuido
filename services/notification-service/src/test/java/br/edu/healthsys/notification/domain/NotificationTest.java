package br.edu.healthsys.notification.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class NotificationTest {

    @Test
    void shouldCreateNotificationWithDefaults() {
        UUID senderId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();
        NotificationChannel channel = new NotificationChannel("Email", "Descricao", true);

        Notification notification = new Notification(
                senderId,
                receiverId,
                NotificationType.APPOINTMENT,
                "Consulta Agendada",
                "Sua consulta foi agendada para amanha",
                true,
                channel
        );

        assertEquals(senderId, notification.getSenderId());
        assertEquals(receiverId, notification.getReceiverId());
        assertEquals(NotificationType.APPOINTMENT, notification.getType());
        assertEquals("Consulta Agendada", notification.getTitle());
        assertEquals("Sua consulta foi agendada para amanha", notification.getMessage());
        assertTrue(notification.isUrgent());
        assertFalse(notification.isRead());
        assertNotNull(notification.getSentAt());
        assertNull(notification.getReadAt());
        assertEquals(channel, notification.getNotificationChannel());
    }

    @Test
    void shouldMarkAsReadAndUnread() {
        UUID receiverId = UUID.randomUUID();
        Notification notification = new Notification(
                null,
                receiverId,
                NotificationType.GENERAL,
                "Aviso",
                "Mensagem de teste",
                false,
                null
        );

        assertFalse(notification.isRead());
        assertNull(notification.getReadAt());

        notification.markAsRead();
        assertTrue(notification.isRead());
        assertNotNull(notification.getReadAt());

        notification.markAsUnread();
        assertFalse(notification.isRead());
        assertNull(notification.getReadAt());
    }
}

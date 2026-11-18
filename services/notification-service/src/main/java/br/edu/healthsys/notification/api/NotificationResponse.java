package br.edu.healthsys.notification.api;

import br.edu.healthsys.notification.domain.Notification;
import br.edu.healthsys.notification.domain.NotificationType;
import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID senderId,
        UUID receiverId,
        NotificationType type,
        String title,
        String message,
        LocalDateTime sentAt,
        LocalDateTime readAt,
        boolean isRead,
        boolean isUrgent,
        NotificationChannelResponse channel
) {
    public static NotificationResponse from(Notification notification) {
        if (notification == null) {
            return null;
        }
        return new NotificationResponse(
                notification.getId(),
                notification.getSenderId(),
                notification.getReceiverId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getSentAt(),
                notification.getReadAt(),
                notification.isRead(),
                notification.isUrgent(),
                NotificationChannelResponse.from(notification.getNotificationChannel())
        );
    }
}

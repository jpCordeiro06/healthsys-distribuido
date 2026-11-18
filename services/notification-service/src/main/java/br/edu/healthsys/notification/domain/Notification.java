package br.edu.healthsys.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(name = "receiver_id", nullable = false)
    private UUID receiverId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "is_urgent", nullable = false)
    private boolean isUrgent = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_channel_id")
    private NotificationChannel notificationChannel;

    protected Notification() {}

    public Notification(UUID senderId, UUID receiverId, NotificationType type, String title,
                        String message, Boolean isUrgent, NotificationChannel notificationChannel) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.type = type != null ? type : NotificationType.GENERAL;
        this.title = title;
        this.message = message;
        this.isUrgent = isUrgent != null ? isUrgent : false;
        this.isRead = false;
        this.sentAt = LocalDateTime.now();
        this.notificationChannel = notificationChannel;
    }

    public Notification(UUID id, UUID senderId, UUID receiverId, NotificationType type, String title,
                        String message, LocalDateTime sentAt, LocalDateTime readAt, boolean isRead,
                        boolean isUrgent, NotificationChannel notificationChannel) {
        this.id = id;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.type = type != null ? type : NotificationType.GENERAL;
        this.title = title;
        this.message = message;
        this.sentAt = sentAt != null ? sentAt : LocalDateTime.now();
        this.readAt = readAt;
        this.isRead = isRead;
        this.isUrgent = isUrgent;
        this.notificationChannel = notificationChannel;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
        if (type == null) {
            type = NotificationType.GENERAL;
        }
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }

    public UUID getId() {
        return id;
    }

    public UUID getSenderId() {
        return senderId;
    }

    public void setSenderId(UUID senderId) {
        this.senderId = senderId;
    }

    public UUID getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(UUID receiverId) {
        this.receiverId = receiverId;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public boolean isUrgent() {
        return isUrgent;
    }

    public void setUrgent(boolean urgent) {
        isUrgent = urgent;
    }

    public NotificationChannel getNotificationChannel() {
        return notificationChannel;
    }

    public void setNotificationChannel(NotificationChannel notificationChannel) {
        this.notificationChannel = notificationChannel;
    }
}

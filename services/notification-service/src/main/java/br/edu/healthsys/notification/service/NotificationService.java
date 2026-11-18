package br.edu.healthsys.notification.service;

import br.edu.healthsys.notification.api.NotificationRequest;
import br.edu.healthsys.notification.domain.Notification;
import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.domain.NotificationType;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import br.edu.healthsys.notification.repository.NotificationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationChannelRepository channelRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationChannelRepository channelRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.channelRepository = channelRepository;
    }

    @Transactional(readOnly = true)
    public List<Notification> list(
            UUID receiverId,
            UUID senderId,
            Boolean isRead,
            Boolean isUrgent,
            NotificationType type,
            UUID channelId
    ) {
        return notificationRepository.findByFilter(receiverId, senderId, isRead, isUrgent, type, channelId);
    }

    @Transactional(readOnly = true)
    public Notification getById(UUID id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificacao nao encontrada."));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID receiverId) {
        if (receiverId == null) {
            return 0;
        }
        return notificationRepository.countByReceiverIdAndIsReadFalse(receiverId);
    }

    public Notification create(NotificationRequest request) {
        NotificationChannel channel = null;
        if (request.notificationChannelId() != null) {
            channel = channelRepository.findById(request.notificationChannelId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Canal de notificacao nao encontrado."));
        }

        Notification notification = new Notification(
                request.senderId(),
                request.receiverId(),
                request.type(),
                request.title(),
                request.message(),
                request.isUrgent(),
                channel
        );

        return notificationRepository.save(notification);
    }

    public Notification markAsRead(UUID id) {
        Notification notification = getById(id);
        notification.markAsRead();
        return notificationRepository.save(notification);
    }

    public Notification markAsUnread(UUID id) {
        Notification notification = getById(id);
        notification.markAsUnread();
        return notificationRepository.save(notification);
    }

    public void delete(UUID id) {
        Notification notification = getById(id);
        notificationRepository.delete(notification);
    }
}

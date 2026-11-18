package br.edu.healthsys.notification.repository;

import br.edu.healthsys.notification.domain.Notification;
import br.edu.healthsys.notification.domain.NotificationType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Override
    @EntityGraph(attributePaths = {"notificationChannel"})
    List<Notification> findAll();

    @Override
    @EntityGraph(attributePaths = {"notificationChannel"})
    Optional<Notification> findById(UUID id);

    @EntityGraph(attributePaths = {"notificationChannel"})
    List<Notification> findByReceiverIdOrderBySentAtDesc(UUID receiverId);

    @EntityGraph(attributePaths = {"notificationChannel"})
    List<Notification> findBySenderIdOrderBySentAtDesc(UUID senderId);

    long countByReceiverIdAndIsReadFalse(UUID receiverId);

    @EntityGraph(attributePaths = {"notificationChannel"})
    @Query("""
        SELECT n FROM Notification n
        WHERE (:receiverId IS NULL OR n.receiverId = :receiverId)
          AND (:senderId IS NULL OR n.senderId = :senderId)
          AND (:isRead IS NULL OR n.isRead = :isRead)
          AND (:isUrgent IS NULL OR n.isUrgent = :isUrgent)
          AND (:type IS NULL OR n.type = :type)
          AND (:channelId IS NULL OR n.notificationChannel.id = :channelId)
        ORDER BY n.sentAt DESC
    """)
    List<Notification> findByFilter(
            @Param("receiverId") UUID receiverId,
            @Param("senderId") UUID senderId,
            @Param("isRead") Boolean isRead,
            @Param("isUrgent") Boolean isUrgent,
            @Param("type") NotificationType type,
            @Param("channelId") UUID channelId
    );
}

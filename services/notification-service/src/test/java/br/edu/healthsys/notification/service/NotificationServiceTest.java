package br.edu.healthsys.notification.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.notification.api.NotificationRequest;
import br.edu.healthsys.notification.domain.Notification;
import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.domain.NotificationType;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import br.edu.healthsys.notification.repository.NotificationRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationChannelRepository channelRepository;

    private NotificationService service;

    @BeforeEach
    void setUp() {
        service = new NotificationService(notificationRepository, channelRepository);
    }

    @Test
    void shouldCreateNotificationWithChannelSuccessfully() {
        UUID channelId = UUID.randomUUID();
        UUID receiverId = UUID.randomUUID();
        UUID senderId = UUID.randomUUID();

        NotificationChannel channel = new NotificationChannel(channelId, "Email", "Descricao", true);
        when(channelRepository.findById(channelId)).thenReturn(Optional.of(channel));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationRequest request = new NotificationRequest(
                senderId,
                receiverId,
                NotificationType.EXAM_RESULT,
                "Resultado Disponivel",
                "O resultado do seu exame de sangue esta pronto.",
                false,
                channelId
        );

        Notification result = service.create(request);

        assertNotNull(result);
        assertEquals(senderId, result.getSenderId());
        assertEquals(receiverId, result.getReceiverId());
        assertEquals(NotificationType.EXAM_RESULT, result.getType());
        assertEquals("Resultado Disponivel", result.getTitle());
        assertEquals(channel, result.getNotificationChannel());
        assertFalse(result.isRead());
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void shouldThrowNotFoundWhenChannelDoesNotExist() {
        UUID channelId = UUID.randomUUID();
        when(channelRepository.findById(channelId)).thenReturn(Optional.empty());

        NotificationRequest request = new NotificationRequest(
                null,
                UUID.randomUUID(),
                NotificationType.GENERAL,
                "Titulo",
                "Mensagem",
                false,
                channelId
        );

        assertThrows(ResponseStatusException.class, () -> service.create(request));
    }

    @Test
    void shouldMarkAsReadAndUnread() {
        UUID id = UUID.randomUUID();
        Notification notification = new Notification(
                null,
                UUID.randomUUID(),
                NotificationType.GENERAL,
                "Titulo",
                "Mensagem",
                false,
                null
        );

        when(notificationRepository.findById(id)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Notification readResult = service.markAsRead(id);
        assertTrue(readResult.isRead());

        Notification unreadResult = service.markAsUnread(id);
        assertFalse(unreadResult.isRead());
    }

    @Test
    void shouldGetUnreadCount() {
        UUID receiverId = UUID.randomUUID();
        when(notificationRepository.countByReceiverIdAndIsReadFalse(receiverId)).thenReturn(5L);

        long count = service.getUnreadCount(receiverId);

        assertEquals(5L, count);
        verify(notificationRepository).countByReceiverIdAndIsReadFalse(receiverId);
    }

    @Test
    void shouldListFilteredNotifications() {
        UUID receiverId = UUID.randomUUID();
        Notification notification = new Notification(
                null,
                receiverId,
                NotificationType.APPOINTMENT,
                "Consulta",
                "Aviso",
                true,
                null
        );

        when(notificationRepository.findByFilter(receiverId, null, false, true, NotificationType.APPOINTMENT, null))
                .thenReturn(List.of(notification));

        List<Notification> result = service.list(receiverId, null, false, true, NotificationType.APPOINTMENT, null);

        assertEquals(1, result.size());
        verify(notificationRepository).findByFilter(receiverId, null, false, true, NotificationType.APPOINTMENT, null);
    }
}

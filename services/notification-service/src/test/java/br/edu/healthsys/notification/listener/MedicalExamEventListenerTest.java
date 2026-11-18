package br.edu.healthsys.notification.listener;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.notification.domain.Notification;
import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.domain.ProcessedEvent;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import br.edu.healthsys.notification.repository.NotificationRepository;
import br.edu.healthsys.notification.repository.ProcessedEventRepository;
import br.edu.healthsys.notification.websocket.RealtimeNotificationPublisher;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MedicalExamEventListenerTest {

    @Mock
    private ProcessedEventRepository processedEventRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationChannelRepository channelRepository;

    @Mock
    private RealtimeNotificationPublisher realtimePublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MedicalExamEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new MedicalExamEventListener(
                processedEventRepository,
                notificationRepository,
                channelRepository,
                realtimePublisher,
                objectMapper
        );
    }

    @Test
    void shouldProcessExamEventAndSendNotificationToPatient() {
        String eventId = UUID.randomUUID().toString();
        UUID patientId = UUID.randomUUID();

        String json = String.format("""
            {
                "eventId": "%s",
                "eventType": "prontuario.exame-registrado",
                "payload": {
                    "idPaciente": "%s",
                    "tipoExame": "Hemograma Completo",
                    "profissionalSolicitante": "Dr. Carlos Silva"
                }
            }
            """, eventId, patientId);

        when(processedEventRepository.existsById(eventId)).thenReturn(false);
        when(channelRepository.findByNameIgnoreCase("WebSocket")).thenReturn(
                Optional.of(new NotificationChannel("WebSocket", "WS Channel", true))
        );
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        listener.handleMedicalExamRegistered(json);

        verify(notificationRepository).save(any(Notification.class));
        verify(realtimePublisher).publishToUser(eq(patientId), any());
        verify(processedEventRepository).save(any(ProcessedEvent.class));
    }

    @Test
    void shouldIgnoreDuplicateExamEvent() {
        String eventId = UUID.randomUUID().toString();
        UUID patientId = UUID.randomUUID();

        String json = String.format("""
            {
                "eventId": "%s",
                "eventType": "prontuario.exame-registrado",
                "payload": {
                    "idPaciente": "%s",
                    "tipoExame": "Hemograma"
                }
            }
            """, eventId, patientId);

        when(processedEventRepository.existsById(eventId)).thenReturn(true);

        listener.handleMedicalExamRegistered(json);

        verify(notificationRepository, never()).save(any());
        verify(realtimePublisher, never()).publishToUser(any(), any());
    }
}

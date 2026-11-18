package br.edu.healthsys.notification.listener;

import br.edu.healthsys.notification.api.NotificationResponse;
import br.edu.healthsys.notification.domain.Notification;
import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.domain.NotificationType;
import br.edu.healthsys.notification.domain.ProcessedEvent;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import br.edu.healthsys.notification.repository.NotificationRepository;
import br.edu.healthsys.notification.repository.ProcessedEventRepository;
import br.edu.healthsys.notification.websocket.RealtimeNotificationPublisher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class MedicalExamEventListener {

    private static final Logger log = LoggerFactory.getLogger(MedicalExamEventListener.class);
    private static final String TOPIC = "prontuario.exame-registrado";

    private final ProcessedEventRepository processedEventRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationChannelRepository channelRepository;
    private final RealtimeNotificationPublisher realtimePublisher;
    private final ObjectMapper objectMapper;

    public MedicalExamEventListener(
            ProcessedEventRepository processedEventRepository,
            NotificationRepository notificationRepository,
            NotificationChannelRepository channelRepository,
            RealtimeNotificationPublisher realtimePublisher,
            ObjectMapper objectMapper
    ) {
        this.processedEventRepository = processedEventRepository;
        this.notificationRepository = notificationRepository;
        this.channelRepository = channelRepository;
        this.realtimePublisher = realtimePublisher;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = TOPIC, groupId = "${spring.kafka.consumer.group-id:notification-service-group}")
    @Transactional
    public void handleMedicalExamRegistered(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventId = root.has("eventId") ? root.get("eventId").asText() : UUID.randomUUID().toString();
            String correlationId = root.has("correlationId") ? root.get("correlationId").asText() : "";

            if (!correlationId.isBlank()) {
                MDC.put("correlationId", correlationId);
            }

            log.info("Recebido evento [{}] com eventId={}", TOPIC, eventId);

            if (processedEventRepository.existsById(eventId)) {
                log.info("Evento com eventId={} ja foi processado previamente. Ignorando.", eventId);
                return;
            }

            JsonNode payload = root.has("payload") ? root.get("payload") : root;
            String idPacienteStr = payload.has("idPaciente") ? payload.get("idPaciente").asText() : null;
            String tipoExame = payload.has("tipoExame") ? payload.get("tipoExame").asText() : "Exame";
            String profissional = payload.has("profissionalSolicitante")
                    ? payload.get("profissionalSolicitante").asText()
                    : (payload.has("profissional") ? payload.get("profissional").asText() : "Equipe Médica");

            if (idPacienteStr != null && !idPacienteStr.isBlank()) {
                UUID idPaciente = UUID.fromString(idPacienteStr);

                NotificationChannel wsChannel = channelRepository.findByNameIgnoreCase("WebSocket")
                        .or(() -> channelRepository.findByNameIgnoreCase("Push"))
                        .orElse(null);

                String titulo = "Novo Exame Registrado: " + tipoExame;
                String mensagem = String.format("Um novo exame (%s) foi registrado no seu prontuário pelo profissional %s.",
                        tipoExame, profissional);

                Notification notification = new Notification(
                        null,
                        idPaciente,
                        NotificationType.EXAM_RESULT,
                        titulo,
                        mensagem,
                        false,
                        wsChannel
                );

                notification = notificationRepository.save(notification);
                NotificationResponse response = NotificationResponse.from(notification);

                // Publica notificação individual na fila do usuário via WebSocket
                realtimePublisher.publishToUser(idPaciente, response);
                log.info("Notificação de exame registrado enviada para o paciente {}", idPaciente);
            }

            processedEventRepository.save(new ProcessedEvent(eventId, TOPIC, LocalDateTime.now()));
        } catch (Exception e) {
            log.error("Erro ao processar mensagem do topico {}: {}", TOPIC, e.getMessage(), e);
            throw new RuntimeException("Falha no processamento do evento de exame registrado", e);
        } finally {
            MDC.remove("correlationId");
        }
    }
}

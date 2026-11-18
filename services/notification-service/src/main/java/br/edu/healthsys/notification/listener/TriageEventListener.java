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
public class TriageEventListener {

    private static final Logger log = LoggerFactory.getLogger(TriageEventListener.class);
    private static final String TOPIC = "triagem.classificada";

    private final ProcessedEventRepository processedEventRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationChannelRepository channelRepository;
    private final RealtimeNotificationPublisher realtimePublisher;
    private final ObjectMapper objectMapper;

    public TriageEventListener(
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
    public void handleTriageClassified(String message) {
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
            String nivelRisco = payload.has("nivelRisco") ? payload.get("nivelRisco").asText() : "";
            String idPacienteStr = payload.has("idPaciente") ? payload.get("idPaciente").asText() : null;
            String idTriagemStr = payload.has("idTriagem") ? payload.get("idTriagem").asText() : null;

            UUID idPaciente = idPacienteStr != null ? UUID.fromString(idPacienteStr) : UUID.randomUUID();
            UUID idTriagem = idTriagemStr != null ? UUID.fromString(idTriagemStr) : null;

            boolean isVermelhoOuLaranja = "VERMELHO".equalsIgnoreCase(nivelRisco) ||
                    "LARANJA".equalsIgnoreCase(nivelRisco) ||
                    "EMERGENCIA".equalsIgnoreCase(nivelRisco) ||
                    "MUITO_URGENTE".equalsIgnoreCase(nivelRisco);

            if (isVermelhoOuLaranja) {
                NotificationChannel wsChannel = channelRepository.findByNameIgnoreCase("WebSocket")
                        .or(() -> channelRepository.findByNameIgnoreCase("Push"))
                        .orElse(null);

                String titulo = "ALERTA DE RISCO - Paciente Prioritário (" + nivelRisco.toUpperCase() + ")";
                String mensagem = String.format("Paciente %s classificado com prioridade alta/crítica (%s). Triagem: %s",
                        idPaciente, nivelRisco.toUpperCase(), idTriagem != null ? idTriagem : "N/A");

                Notification notification = new Notification(
                        null,
                        idPaciente,
                        NotificationType.TRIAGE_ALERT,
                        titulo,
                        mensagem,
                        true,
                        wsChannel
                );

                notification = notificationRepository.save(notification);
                NotificationResponse response = NotificationResponse.from(notification);

                // Publica alerta no WebSocket para a equipe médica/enfermagem
                realtimePublisher.publishRiskAlert(response);
                log.info("Alerta de risco crítico processado e disparado com sucesso para a triagem {}", idTriagem);
            } else {
                log.info("Triagem classificada com nível de risco {}. Não requer alerta crítico em tempo real.", nivelRisco);
            }

            processedEventRepository.save(new ProcessedEvent(eventId, TOPIC, LocalDateTime.now()));
        } catch (Exception e) {
            log.error("Erro ao processar mensagem do topico {}: {}", TOPIC, e.getMessage(), e);
            throw new RuntimeException("Falha no processamento do evento de triagem", e);
        } finally {
            MDC.remove("correlationId");
        }
    }
}

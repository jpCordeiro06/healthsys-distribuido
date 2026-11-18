package br.edu.healthsys.record.listener;

import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.domain.ProcessedEvent;
import br.edu.healthsys.record.repository.MedicalRecordRepository;
import br.edu.healthsys.record.repository.ProcessedEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PatientCreatedEventListener {

    private static final Logger log = LoggerFactory.getLogger(PatientCreatedEventListener.class);
    public static final String TOPIC = "pacientes.cadastrado";

    private final ProcessedEventRepository processedEventRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ObjectMapper objectMapper;

    public PatientCreatedEventListener(
            ProcessedEventRepository processedEventRepository,
            MedicalRecordRepository medicalRecordRepository,
            ObjectMapper objectMapper
    ) {
        this.processedEventRepository = processedEventRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = TOPIC, groupId = "${spring.kafka.consumer.group-id:medical-record-service-group}")
    public void handlePatientCreated(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventIdStr = root.path("eventId").asText(null);
            String correlationId = root.path("correlationId").asText(null);
            String eventType = root.path("eventType").asText(TOPIC);

            if (correlationId != null) {
                MDC.put("correlationId", correlationId);
            }

            if (eventIdStr == null) {
                log.warn("Evento recebido sem eventId no topico {}. Ignorando.", TOPIC);
                return;
            }

            UUID eventId = UUID.fromString(eventIdStr);
            if (processedEventRepository.existsById(eventId)) {
                log.info("Evento com eventId={} ja foi processado. Ignorando duplicata.", eventId);
                return;
            }

            JsonNode payloadNode = root.path("payload");
            String patientIdStr = payloadNode.path("idPaciente").asText(null);
            if (patientIdStr == null || patientIdStr.isBlank()) {
                patientIdStr = payloadNode.path("id").asText(null);
            }

            if (patientIdStr != null && !patientIdStr.isBlank()) {
                UUID patientId = UUID.fromString(patientIdStr);
                if (!medicalRecordRepository.existsByPatientId(patientId)) {
                    try {
                        MedicalRecord record = new MedicalRecord(patientId);
                        medicalRecordRepository.save(record);
                        log.info("Prontuario inicial criado automaticamente para o paciente={}", patientId);
                    } catch (DuplicateKeyException e) {
                        log.info("Prontuario para o paciente={} ja foi criado concorrentemente.", patientId);
                    }
                }
            }

            try {
                processedEventRepository.save(new ProcessedEvent(eventId, eventType));
                log.info("Evento {} processado com sucesso. eventId={}", eventType, eventId);
            } catch (DuplicateKeyException e) {
                log.info("Evento com eventId={} ja foi registrado concorrentemente.", eventId);
            }
        } catch (Exception e) {
            log.error("Erro ao processar evento de paciente cadastrado: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao processar evento de paciente cadastrado", e);
        } finally {
            MDC.remove("correlationId");
        }
    }
}

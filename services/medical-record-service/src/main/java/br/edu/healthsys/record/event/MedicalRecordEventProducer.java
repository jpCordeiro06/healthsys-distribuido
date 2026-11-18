package br.edu.healthsys.record.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class MedicalRecordEventProducer {

    private static final Logger log = LoggerFactory.getLogger(MedicalRecordEventProducer.class);
    public static final String EXAM_REGISTERED_TOPIC = "prontuario.exame-registrado";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public MedicalRecordEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishMedicalExamRegistered(MedicalExamRegisteredPayload payload, String correlationId) {
        EventEnvelope<MedicalExamRegisteredPayload> envelope = EventEnvelope.of(
                EXAM_REGISTERED_TOPIC,
                correlationId,
                payload
        );

        String messageKey = payload.idPaciente() != null ? payload.idPaciente().toString() : envelope.eventId();
        log.info("Publicando evento {} no topico {} com key={} e eventId={}",
                EXAM_REGISTERED_TOPIC, EXAM_REGISTERED_TOPIC, messageKey, envelope.eventId());
        kafkaTemplate.send(EXAM_REGISTERED_TOPIC, messageKey, envelope);
    }
}

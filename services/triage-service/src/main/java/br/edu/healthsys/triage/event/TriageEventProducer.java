package br.edu.healthsys.triage.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class TriageEventProducer {

    private static final Logger log = LoggerFactory.getLogger(TriageEventProducer.class);
    public static final String TOPIC = "triagem.classificada";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public TriageEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishTriageClassified(TriageClassifiedPayload payload, String correlationId) {
        EventEnvelope<TriageClassifiedPayload> envelope = EventEnvelope.of(
                TOPIC,
                correlationId,
                payload
        );

        log.info("Publicando evento {} no topico {} com eventId={}", TOPIC, TOPIC, envelope.eventId());
        kafkaTemplate.send(TOPIC, payload.idTriagem().toString(), envelope);
    }
}

package br.edu.healthsys.triage.event;

import java.time.Instant;
import java.util.UUID;

public record EventEnvelope<T>(
        String eventId,
        String eventType,
        Instant occurredAt,
        String source,
        String correlationId,
        T payload
) {
    public static <T> EventEnvelope<T> of(String eventType, String correlationId, T payload) {
        return new EventEnvelope<>(
                UUID.randomUUID().toString(),
                eventType,
                Instant.now(),
                "servico-triagem",
                correlationId != null ? correlationId : UUID.randomUUID().toString(),
                payload
        );
    }
}

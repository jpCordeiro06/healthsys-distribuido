package br.edu.healthsys.notification.event;

import java.time.Instant;

public record EventEnvelope<T>(
        String eventId,
        String eventType,
        Instant occurredAt,
        String source,
        String correlationId,
        T payload
) {
    public static <T> EventEnvelope<T> of(String eventType, String source, String correlationId, T payload) {
        return new EventEnvelope<>(
                java.util.UUID.randomUUID().toString(),
                eventType,
                Instant.now(),
                source,
                correlationId,
                payload
        );
    }
}

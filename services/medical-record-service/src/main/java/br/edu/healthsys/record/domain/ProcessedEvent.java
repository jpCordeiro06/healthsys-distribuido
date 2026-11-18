package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "processed_events")
public class ProcessedEvent {

    @Id
    private UUID eventId;

    private String eventType;
    private LocalDateTime processedAt;

    public ProcessedEvent() {
        this.processedAt = LocalDateTime.now();
    }

    public ProcessedEvent(UUID eventId, String eventType) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.processedAt = LocalDateTime.now();
    }

    public ProcessedEvent(UUID eventId, String eventType, LocalDateTime processedAt) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.processedAt = processedAt != null ? processedAt : LocalDateTime.now();
    }

    public void prePersist() {
        if (processedAt == null) {
            processedAt = LocalDateTime.now();
        }
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
}

package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.RiskClassification;
import java.util.UUID;

public record RiskClassificationResponse(
        UUID id,
        String name,
        String description,
        Integer priorityLevel,
        Boolean active
) {
    public static RiskClassificationResponse from(RiskClassification entity) {
        if (entity == null) return null;
        return new RiskClassificationResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPriorityLevel(),
                entity.getActive()
        );
    }
}

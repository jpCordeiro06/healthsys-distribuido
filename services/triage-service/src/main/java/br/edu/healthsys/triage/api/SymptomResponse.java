package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.Symptom;
import java.util.UUID;

public record SymptomResponse(
        UUID id,
        String name,
        String description,
        Boolean active
) {
    public static SymptomResponse from(Symptom entity) {
        if (entity == null) return null;
        return new SymptomResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getActive()
        );
    }
}

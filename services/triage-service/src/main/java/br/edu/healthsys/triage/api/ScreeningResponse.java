package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.Screening;
import br.edu.healthsys.triage.domain.ScreeningStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ScreeningResponse(
        UUID id,
        UUID patientId,
        UUID doctorId,
        RiskClassificationResponse riskClassification,
        ScreeningStatus status,
        LocalDateTime screeningDate,
        LocalDateTime updatedAt,
        String notes,
        List<SymptomResponse> symptoms
) {
    public static ScreeningResponse from(Screening entity) {
        if (entity == null) return null;
        List<SymptomResponse> symptomsList = entity.getSymptoms() != null
                ? entity.getSymptoms().stream().map(SymptomResponse::from).toList()
                : List.of();

        return new ScreeningResponse(
                entity.getId(),
                entity.getPatientId(),
                entity.getDoctorId(),
                RiskClassificationResponse.from(entity.getRiskClassification()),
                entity.getStatus(),
                entity.getScreeningDate(),
                entity.getUpdatedAt(),
                entity.getNotes(),
                symptomsList
        );
    }
}

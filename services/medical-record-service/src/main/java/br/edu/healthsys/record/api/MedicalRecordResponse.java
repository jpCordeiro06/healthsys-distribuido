package br.edu.healthsys.record.api;

import br.edu.healthsys.record.domain.MedicalRecord;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record MedicalRecordResponse(
        UUID id,
        UUID patientId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<MedicalExamResponse> exams,
        List<DiagnosisResponse> diagnoses
) {
    public static MedicalRecordResponse from(MedicalRecord record) {
        if (record == null) return null;
        List<MedicalExamResponse> exams = record.getExams() != null
                ? record.getExams().stream().map(MedicalExamResponse::from).toList()
                : Collections.emptyList();

        List<DiagnosisResponse> diagnoses = record.getDiagnoses() != null
                ? record.getDiagnoses().stream().map(DiagnosisResponse::from).toList()
                : Collections.emptyList();

        return new MedicalRecordResponse(
                record.getId(),
                record.getPatientId(),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                exams,
                diagnoses
        );
    }
}

package br.edu.healthsys.record.api;

import br.edu.healthsys.record.domain.Diagnosis;
import java.time.LocalDateTime;
import java.util.UUID;

public record DiagnosisResponse(
        UUID id,
        UUID medicalRecordId,
        UUID patientId,
        String description,
        UUID doctorId,
        LocalDateTime date,
        String laboratoryName,
        boolean validated
) {
    public static DiagnosisResponse from(Diagnosis diagnosis) {
        if (diagnosis == null) return null;
        UUID patientId = diagnosis.getMedicalRecord() != null ? diagnosis.getMedicalRecord().getPatientId() : null;
        UUID medicalRecordId = diagnosis.getMedicalRecord() != null ? diagnosis.getMedicalRecord().getId() : null;

        return new DiagnosisResponse(
                diagnosis.getId(),
                medicalRecordId,
                patientId,
                diagnosis.getDescription(),
                diagnosis.getDoctorId(),
                diagnosis.getDate(),
                diagnosis.getLaboratoryName(),
                diagnosis.isValidated()
        );
    }
}

package br.edu.healthsys.record.api;

import br.edu.healthsys.record.domain.MedicalExam;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record MedicalExamResponse(
        UUID id,
        UUID medicalRecordId,
        UUID patientId,
        String type,
        LocalDateTime date,
        UUID doctorId,
        boolean hasResult,
        List<ExamResultResponse> results
) {
    public static MedicalExamResponse from(MedicalExam exam) {
        if (exam == null) return null;
        List<ExamResultResponse> results = exam.getResults() != null
                ? exam.getResults().stream().map(ExamResultResponse::from).toList()
                : Collections.emptyList();

        UUID patientId = exam.getMedicalRecord() != null ? exam.getMedicalRecord().getPatientId() : null;
        UUID medicalRecordId = exam.getMedicalRecord() != null ? exam.getMedicalRecord().getId() : null;

        return new MedicalExamResponse(
                exam.getId(),
                medicalRecordId,
                patientId,
                exam.getType(),
                exam.getDate(),
                exam.getDoctorId(),
                exam.isHasResult(),
                results
        );
    }
}

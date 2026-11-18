package br.edu.healthsys.record.api;

import br.edu.healthsys.record.domain.ExamResult;
import java.time.LocalDateTime;
import java.util.UUID;

public record ExamResultResponse(
        UUID id,
        UUID medicalExamId,
        LocalDateTime resultDate,
        String resultSummary,
        String detailedReport,
        String laboratoryName,
        boolean validated
) {
    public static ExamResultResponse from(ExamResult result) {
        if (result == null) return null;
        return new ExamResultResponse(
                result.getId(),
                result.getMedicalExam() != null ? result.getMedicalExam().getId() : null,
                result.getResultDate(),
                result.getResultSummary(),
                result.getDetailedReport(),
                result.getLaboratoryName(),
                result.isValidated()
        );
    }
}

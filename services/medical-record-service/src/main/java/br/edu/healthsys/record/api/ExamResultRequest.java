package br.edu.healthsys.record.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record ExamResultRequest(
        @NotNull(message = "O ID do exame e obrigatorio.")
        UUID medicalExamId,

        LocalDateTime resultDate,

        @NotBlank(message = "O resumo do resultado e obrigatorio.")
        String resultSummary,

        String detailedReport,

        String laboratoryName,

        Boolean validated
) {}

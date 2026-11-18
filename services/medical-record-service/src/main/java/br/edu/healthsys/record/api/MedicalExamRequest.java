package br.edu.healthsys.record.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record MedicalExamRequest(
        @NotNull(message = "O ID do prontuario e obrigatorio.")
        UUID medicalRecordId,

        @NotBlank(message = "O tipo do exame e obrigatorio.")
        String type,

        LocalDateTime date,

        UUID doctorId,

        Boolean hasResult
) {}

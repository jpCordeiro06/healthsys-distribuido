package br.edu.healthsys.record.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public record DiagnosisRequest(
        @NotNull(message = "O ID do prontuario e obrigatorio.")
        UUID medicalRecordId,

        @NotBlank(message = "A descricao do diagnostico e obrigatoria.")
        String description,

        UUID doctorId,

        LocalDateTime date,

        String laboratoryName,

        Boolean validated
) {}

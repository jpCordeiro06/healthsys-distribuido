package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.ScreeningStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record ScreeningRequest(
        @NotNull(message = "O ID do paciente e obrigatorio.")
        UUID patientId,

        UUID doctorId,

        UUID riskClassificationId,

        ScreeningStatus status,

        LocalDateTime screeningDate,

        @Size(max = 5000, message = "As observacoes devem ter no maximo 5000 caracteres.")
        String notes,

        Set<UUID> symptomIds
) {}

package br.edu.healthsys.record.api;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MedicalRecordRequest(
        @NotNull(message = "O ID do paciente e obrigatorio.")
        UUID patientId
) {}

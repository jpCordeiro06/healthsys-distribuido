package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.ScreeningStatus;
import jakarta.validation.constraints.NotNull;

public record ScreeningStatusUpdateRequest(
        @NotNull(message = "O status da triagem e obrigatorio.")
        ScreeningStatus status
) {}

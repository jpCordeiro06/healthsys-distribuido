package br.edu.healthsys.record.api;

import jakarta.validation.constraints.NotNull;

public record ValidationStatusUpdateRequest(
        @NotNull(message = "O status de validacao e obrigatorio.")
        Boolean validated
) {}

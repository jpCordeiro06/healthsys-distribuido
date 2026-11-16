package br.edu.healthsys.triage.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RiskClassificationRequest(
        @NotBlank(message = "O nome da classificacao e obrigatorio.")
        @Size(max = 100, message = "O nome deve ter no maximo 100 caracteres.")
        String name,

        @Size(max = 255, message = "A descricao deve ter no maximo 255 caracteres.")
        String description,

        @NotNull(message = "O nivel de prioridade e obrigatorio.")
        @Min(value = 1, message = "O nivel de prioridade deve ser no minimo 1.")
        Integer priorityLevel,

        Boolean active
) {}

package br.edu.healthsys.triage.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SymptomRequest(
        @NotBlank(message = "O nome do sintoma e obrigatorio.")
        @Size(max = 100, message = "O nome deve ter no maximo 100 caracteres.")
        String name,

        @Size(max = 255, message = "A descricao deve ter no maximo 255 caracteres.")
        String description,

        Boolean active
) {}

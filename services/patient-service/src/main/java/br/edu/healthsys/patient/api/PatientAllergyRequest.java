package br.edu.healthsys.patient.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PatientAllergyRequest(
        @NotBlank(message = "O alergeno e obrigatorio.") @Size(max = 150) String alergeno,
        @Size(max = 500) String reacao,
        @Size(max = 1000) String observacoes) {}

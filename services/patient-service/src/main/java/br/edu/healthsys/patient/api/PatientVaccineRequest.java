package br.edu.healthsys.patient.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PatientVaccineRequest(
        @NotBlank(message = "O nome da vacina e obrigatorio.") @Size(max = 150) String vacina,
        @NotBlank(message = "A dose e obrigatoria.") @Size(max = 100) String dose,
        @NotNull(message = "A data de aplicacao e obrigatoria.") @PastOrPresent(message = "A data de aplicacao nao pode estar no futuro.") LocalDate dataAplicacao,
        @Size(max = 100) String lote,
        LocalDate proximaDose) {}

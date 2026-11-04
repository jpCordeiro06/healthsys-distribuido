package br.edu.healthsys.patient.api;

import br.edu.healthsys.patient.validation.CPF;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record PatientRequest(
        @NotBlank(message = "O nome e obrigatorio.") @Size(max = 150, message = "O nome deve ter no maximo 150 caracteres.") String nome,
        @NotBlank(message = "O CPF e obrigatorio.") @CPF String cpf,
        @NotNull(message = "A data de nascimento e obrigatoria.") @PastOrPresent(message = "A data de nascimento nao pode estar no futuro.") LocalDate dataNascimento,
        @NotBlank(message = "O sexo e obrigatorio.") @Size(max = 30, message = "O sexo deve ter no maximo 30 caracteres.") String sexo,
        @Size(max = 30, message = "O telefone deve ter no maximo 30 caracteres.") String telefone,
        @Valid List<PatientAllergyRequest> alergias,
        @Valid List<PatientVaccineRequest> vacinas) {}

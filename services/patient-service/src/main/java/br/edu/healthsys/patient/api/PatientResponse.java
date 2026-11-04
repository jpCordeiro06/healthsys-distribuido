package br.edu.healthsys.patient.api;

import br.edu.healthsys.patient.domain.Patient;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PatientResponse(UUID id, String nome, String cpf, LocalDate dataNascimento, String sexo, String telefone,
        List<PatientAllergyResponse> alergias, List<PatientVaccineResponse> vacinas) {
    public static PatientResponse from(Patient patient) {
        return new PatientResponse(patient.getId(), patient.getNome(), patient.getCpf(), patient.getDataNascimento(),
                patient.getSexo(), patient.getTelefone(),
                patient.getAlergias().stream().map(PatientAllergyResponse::from).toList(),
                patient.getVacinas().stream().map(PatientVaccineResponse::from).toList());
    }
}

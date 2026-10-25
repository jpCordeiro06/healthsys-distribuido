package br.edu.healthsys.patient.api;

import br.edu.healthsys.patient.domain.Patient;
import java.time.LocalDate;
import java.util.UUID;

public record PatientResponse(
        UUID id,
        String nome,
        LocalDate dataNascimento,
        String sexo,
        String telefone) {

    public static PatientResponse from(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getNome(),
                patient.getDataNascimento(),
                patient.getSexo(),
                patient.getTelefone());
    }
}

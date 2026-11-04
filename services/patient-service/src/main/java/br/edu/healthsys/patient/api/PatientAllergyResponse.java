package br.edu.healthsys.patient.api;

import br.edu.healthsys.patient.domain.PatientAllergy;
import java.util.UUID;

public record PatientAllergyResponse(UUID id, String alergeno, String reacao, String observacoes) {
    public static PatientAllergyResponse from(PatientAllergy allergy) {
        return new PatientAllergyResponse(allergy.getId(), allergy.getAlergeno(), allergy.getReacao(), allergy.getObservacoes());
    }
}

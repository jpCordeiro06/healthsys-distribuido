package br.edu.healthsys.patient.api;

import br.edu.healthsys.patient.domain.PatientVaccine;
import java.time.LocalDate;
import java.util.UUID;

public record PatientVaccineResponse(UUID id, String vacina, String dose, LocalDate dataAplicacao, String lote, LocalDate proximaDose) {
    public static PatientVaccineResponse from(PatientVaccine vaccine) {
        return new PatientVaccineResponse(vaccine.getId(), vaccine.getVacina(), vaccine.getDose(), vaccine.getDataAplicacao(), vaccine.getLote(), vaccine.getProximaDose());
    }
}

package br.edu.healthsys.triage.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ScreeningTest {

    @Test
    void shouldCreateScreeningWithDefaults() {
        UUID patientId = UUID.randomUUID();
        Screening screening = new Screening(patientId, null, null, null, null, "Observacao teste", null);

        assertEquals(patientId, screening.getPatientId());
        assertEquals(ScreeningStatus.AGUARDANDO, screening.getStatus());
        assertNotNull(screening.getScreeningDate());
        assertNotNull(screening.getUpdatedAt());
        assertEquals("Observacao teste", screening.getNotes());
        assertTrue(screening.getSymptoms().isEmpty());
    }

    @Test
    void shouldAddAndRemoveSymptoms() {
        UUID patientId = UUID.randomUUID();
        Screening screening = new Screening(patientId, null, null, null, null, null, new HashSet<>());

        Symptom symptom = new Symptom("Febre", "Febre alta", true);
        screening.addSymptom(symptom);

        assertEquals(1, screening.getSymptoms().size());
        assertTrue(screening.getSymptoms().contains(symptom));

        screening.removeSymptom(symptom);
        assertTrue(screening.getSymptoms().isEmpty());
    }

    @Test
    void shouldUpdateStatus() {
        UUID patientId = UUID.randomUUID();
        Screening screening = new Screening(patientId, null, null, ScreeningStatus.AGUARDANDO, null, null, null);

        screening.updateStatus(ScreeningStatus.ATENDIDO);
        assertEquals(ScreeningStatus.ATENDIDO, screening.getStatus());
    }
}

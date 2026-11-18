package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DiagnosisTest {

    @Test
    @DisplayName("Deve instanciar diagnostico e atualizar campos corretamente")
    void testCreateAndUpdateDiagnosis() {
        MedicalRecord record = new MedicalRecord(UUID.randomUUID());
        UUID doctorId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        Diagnosis diagnosis = new Diagnosis(record, "Diabetes Tipo 2", doctorId, now, "Lab Gama", false);

        assertEquals("Diabetes Tipo 2", diagnosis.getDescription());
        assertEquals(doctorId, diagnosis.getDoctorId());
        assertEquals(now, diagnosis.getDate());
        assertEquals("Lab Gama", diagnosis.getLaboratoryName());
        assertFalse(diagnosis.isValidated());

        UUID newDoctor = UUID.randomUUID();
        LocalDateTime newDate = now.plusDays(2);
        diagnosis.update("Diabetes Tipo 2 Controlada", newDoctor, newDate, "Lab Delta", true);

        assertEquals("Diabetes Tipo 2 Controlada", diagnosis.getDescription());
        assertEquals(newDoctor, diagnosis.getDoctorId());
        assertEquals(newDate, diagnosis.getDate());
        assertEquals("Lab Delta", diagnosis.getLaboratoryName());
        assertTrue(diagnosis.isValidated());
    }
}

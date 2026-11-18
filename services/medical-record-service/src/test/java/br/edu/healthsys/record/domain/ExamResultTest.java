package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExamResultTest {

    @Test
    @DisplayName("Deve instanciar resultado de exame e atualizar campos corretamente")
    void testCreateAndUpdateExamResult() {
        MedicalRecord record = new MedicalRecord(UUID.randomUUID());
        MedicalExam exam = new MedicalExam(record, "SANGUE", LocalDateTime.now(), UUID.randomUUID(), false);
        LocalDateTime now = LocalDateTime.now();

        ExamResult result = new ExamResult(exam, now, "Glicemia 90mg/dL", "Normal", "Laboratorio Alpha", false);

        assertEquals("Glicemia 90mg/dL", result.getResultSummary());
        assertEquals("Normal", result.getDetailedReport());
        assertEquals("Laboratorio Alpha", result.getLaboratoryName());
        assertFalse(result.isValidated());

        result.update(now.plusDays(1), "Glicemia 95mg/dL", "Novo laudo", "Laboratorio Beta", true);

        assertEquals("Glicemia 95mg/dL", result.getResultSummary());
        assertEquals("Novo laudo", result.getDetailedReport());
        assertEquals("Laboratorio Beta", result.getLaboratoryName());
        assertTrue(result.isValidated());
    }
}

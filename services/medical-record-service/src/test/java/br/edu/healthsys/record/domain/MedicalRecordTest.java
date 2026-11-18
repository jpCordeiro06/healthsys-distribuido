package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MedicalRecordTest {

    @Test
    @DisplayName("Deve instanciar prontuario e gerar campos necessarios")
    void testCreateMedicalRecord() {
        UUID patientId = UUID.randomUUID();
        MedicalRecord record = new MedicalRecord(patientId);

        assertNull(record.getId());
        assertEquals(patientId, record.getPatientId());
        assertNotNull(record.getCreatedAt());
        assertNotNull(record.getUpdatedAt());
        assertTrue(record.getExams().isEmpty());
        assertTrue(record.getDiagnoses().isEmpty());

        record.prePersist();
        assertNotNull(record.getId());
    }

    @Test
    @DisplayName("Deve adicionar e remover exames e diagnosticos corretamente")
    void testAddAndRemoveExamsAndDiagnoses() {
        UUID patientId = UUID.randomUUID();
        MedicalRecord record = new MedicalRecord(patientId);

        MedicalExam exam = new MedicalExam(record, "SANGUE", LocalDateTime.now(), UUID.randomUUID(), false);
        record.addExam(exam);

        assertEquals(1, record.getExams().size());
        assertEquals(record, exam.getMedicalRecord());

        record.removeExam(exam);
        assertTrue(record.getExams().isEmpty());
        assertNull(exam.getMedicalRecord());

        Diagnosis diagnosis = new Diagnosis(record, "Hipertensao", UUID.randomUUID(), LocalDateTime.now(), "Lab", true);
        record.addDiagnosis(diagnosis);

        assertEquals(1, record.getDiagnoses().size());
        assertEquals(record, diagnosis.getMedicalRecord());

        record.removeDiagnosis(diagnosis);
        assertTrue(record.getDiagnoses().isEmpty());
        assertNull(diagnosis.getMedicalRecord());
    }
}

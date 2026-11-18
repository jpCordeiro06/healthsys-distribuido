package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MedicalExamTest {

    @Test
    @DisplayName("Deve instanciar exame e atualizar campos corretamente")
    void testCreateAndUpdateExam() {
        MedicalRecord record = new MedicalRecord(UUID.randomUUID());
        UUID doctorId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        MedicalExam exam = new MedicalExam(record, "RAIO_X", now, doctorId, false);
        assertEquals("RAIO_X", exam.getType());
        assertEquals(now, exam.getDate());
        assertEquals(doctorId, exam.getDoctorId());
        assertFalse(exam.isHasResult());

        UUID newDoctor = UUID.randomUUID();
        LocalDateTime newDate = now.plusDays(1);
        exam.update("TOMOGRAFIA", newDate, newDoctor, true);

        assertEquals("TOMOGRAFIA", exam.getType());
        assertEquals(newDate, exam.getDate());
        assertEquals(newDoctor, exam.getDoctorId());
        assertTrue(exam.isHasResult());
    }

    @Test
    @DisplayName("Deve manipular resultados de exame e atualizar hasResult")
    void testAddAndRemoveExamResult() {
        MedicalRecord record = new MedicalRecord(UUID.randomUUID());
        MedicalExam exam = new MedicalExam(record, "SANGUE", LocalDateTime.now(), UUID.randomUUID(), false);

        ExamResult result = new ExamResult(exam, LocalDateTime.now(), "Hemograma Normal", "Detalhes", "Lab Central", true);
        exam.addResult(result);

        assertEquals(1, exam.getResults().size());
        assertTrue(exam.isHasResult());
        assertEquals(exam, result.getMedicalExam());

        exam.removeResult(result);
        assertTrue(exam.getResults().isEmpty());
        assertFalse(exam.isHasResult());
    }
}

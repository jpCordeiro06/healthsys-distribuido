package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.MedicalExamRequest;
import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.event.MedicalRecordEventProducer;
import br.edu.healthsys.record.repository.ExamResultRepository;
import br.edu.healthsys.record.repository.MedicalExamRepository;
import br.edu.healthsys.record.repository.MedicalRecordRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicalExamServiceTest {

    @Mock
    private MedicalExamRepository repository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private ExamResultRepository examResultRepository;

    @Mock
    private MedicalRecordEventProducer eventProducer;

    @InjectMocks
    private MedicalExamService service;

    private MedicalRecord record;
    private UUID recordId;
    private UUID doctorId;

    @BeforeEach
    void setUp() {
        recordId = UUID.randomUUID();
        doctorId = UUID.randomUUID();
        record = new MedicalRecord(recordId, UUID.randomUUID(), LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    @DisplayName("Deve criar exame e publicar evento no Kafka")
    void testCreateSuccess() {
        MedicalExamRequest request = new MedicalExamRequest(recordId, "SANGUE", LocalDateTime.now(), doctorId, false);
        MedicalExam exam = new MedicalExam(record, "SANGUE", LocalDateTime.now(), doctorId, false);

        when(medicalRecordRepository.findById(recordId)).thenReturn(Optional.of(record));
        when(repository.save(any(MedicalExam.class))).thenReturn(exam);

        MedicalExam created = service.create(request, "corr-123");

        assertNotNull(created);
        assertEquals("SANGUE", created.getType());
        verify(repository).save(any(MedicalExam.class));
        verify(eventProducer).publishMedicalExamRegistered(any(), eq("corr-123"));
    }

    @Test
    @DisplayName("Deve lancar NOT_FOUND ao criar exame para prontuario inexistente")
    void testCreateRecordNotFound() {
        MedicalExamRequest request = new MedicalExamRequest(recordId, "SANGUE", LocalDateTime.now(), doctorId, false);
        when(medicalRecordRepository.findById(recordId)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.create(request, null));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(repository, never()).save(any());
        verify(eventProducer, never()).publishMedicalExamRegistered(any(), any());
    }

    @Test
    @DisplayName("Deve buscar exame por ID")
    void testGetById() {
        UUID examId = UUID.randomUUID();
        MedicalExam exam = new MedicalExam(record, "RAIO_X", LocalDateTime.now(), doctorId, true);
        when(repository.findByIdWithDetails(examId)).thenReturn(Optional.of(exam));

        MedicalExam found = service.getById(examId);

        assertNotNull(found);
        assertEquals("RAIO_X", found.getType());
    }

    @Test
    @DisplayName("Deve listar exames por filtros")
    void testList() {
        MedicalExam exam = new MedicalExam(record, "RAIO_X", LocalDateTime.now(), doctorId, true);
        when(repository.findByFilter(recordId, null, doctorId, "RAIO_X", true)).thenReturn(List.of(exam));

        List<MedicalExam> list = service.list(recordId, null, doctorId, "RAIO_X", true);

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("Deve atualizar exame existente")
    void testUpdate() {
        UUID examId = UUID.randomUUID();
        MedicalExam exam = new MedicalExam(record, "RAIO_X", LocalDateTime.now(), doctorId, false);
        when(repository.findByIdWithDetails(examId)).thenReturn(Optional.of(exam));
        when(repository.save(any(MedicalExam.class))).thenReturn(exam);

        MedicalExamRequest request = new MedicalExamRequest(recordId, "TOMOGRAFIA", LocalDateTime.now(), doctorId, true);
        MedicalExam updated = service.update(examId, request);

        assertNotNull(updated);
        assertEquals("TOMOGRAFIA", updated.getType());
        assertTrue(updated.isHasResult());
    }

    @Test
    @DisplayName("Deve deletar exame existente")
    void testDelete() {
        UUID examId = UUID.randomUUID();
        MedicalExam exam = new MedicalExam(record, "RAIO_X", LocalDateTime.now(), doctorId, false);
        when(repository.findByIdWithDetails(examId)).thenReturn(Optional.of(exam));

        service.delete(examId);

        verify(repository).delete(exam);
    }
}

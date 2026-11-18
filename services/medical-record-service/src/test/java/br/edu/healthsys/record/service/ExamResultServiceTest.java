package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.ExamResultRequest;
import br.edu.healthsys.record.domain.ExamResult;
import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.repository.ExamResultRepository;
import br.edu.healthsys.record.repository.MedicalExamRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamResultServiceTest {

    @Mock
    private ExamResultRepository repository;

    @Mock
    private MedicalExamRepository medicalExamRepository;

    @InjectMocks
    private ExamResultService service;

    private MedicalExam exam;
    private UUID examId;

    @BeforeEach
    void setUp() {
        examId = UUID.randomUUID();
        MedicalRecord record = new MedicalRecord(UUID.randomUUID());
        exam = new MedicalExam(examId, record, "SANGUE", LocalDateTime.now(), UUID.randomUUID(), false);
    }

    @Test
    @DisplayName("Deve criar resultado de exame e atualizar hasResult")
    void testCreateSuccess() {
        ExamResultRequest request = new ExamResultRequest(examId, LocalDateTime.now(), "Normal", "Detalhes", "Lab", true);
        ExamResult result = new ExamResult(exam, LocalDateTime.now(), "Normal", "Detalhes", "Lab", true);

        when(medicalExamRepository.findById(examId)).thenReturn(Optional.of(exam));
        when(repository.save(any(ExamResult.class))).thenReturn(result);

        ExamResult created = service.create(request);

        assertNotNull(created);
        assertEquals("Normal", created.getResultSummary());
        verify(medicalExamRepository).save(exam);
        verify(repository).save(any(ExamResult.class));
    }

    @Test
    @DisplayName("Deve buscar resultado por ID")
    void testGetById() {
        UUID resultId = UUID.randomUUID();
        ExamResult result = new ExamResult(exam, LocalDateTime.now(), "Normal", "Detalhes", "Lab", true);
        when(repository.findByIdWithDetails(resultId)).thenReturn(Optional.of(result));

        ExamResult found = service.getById(resultId);

        assertNotNull(found);
        assertEquals("Normal", found.getResultSummary());
    }

    @Test
    @DisplayName("Deve listar resultados por ID do exame")
    void testList() {
        ExamResult result = new ExamResult(exam, LocalDateTime.now(), "Normal", "Detalhes", "Lab", true);
        when(repository.findByFilter(examId)).thenReturn(List.of(result));

        List<ExamResult> list = service.list(examId);

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("Deve validar resultado de exame")
    void testValidate() {
        UUID resultId = UUID.randomUUID();
        ExamResult result = new ExamResult(exam, LocalDateTime.now(), "Normal", "Detalhes", "Lab", false);
        when(repository.findByIdWithDetails(resultId)).thenReturn(Optional.of(result));
        when(repository.save(any(ExamResult.class))).thenReturn(result);

        ExamResult validated = service.validate(resultId, true);

        assertTrue(validated.isValidated());
        verify(repository).save(result);
    }

    @Test
    @DisplayName("Deve deletar resultado e atualizar status do exame")
    void testDelete() {
        UUID resultId = UUID.randomUUID();
        ExamResult result = new ExamResult(exam, LocalDateTime.now(), "Normal", "Detalhes", "Lab", false);
        when(repository.findByIdWithDetails(resultId)).thenReturn(Optional.of(result));

        service.delete(resultId);

        verify(repository).delete(result);
    }
}

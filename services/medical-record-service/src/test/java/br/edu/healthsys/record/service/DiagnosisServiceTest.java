package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.DiagnosisRequest;
import br.edu.healthsys.record.domain.Diagnosis;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.repository.DiagnosisRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiagnosisServiceTest {

    @Mock
    private DiagnosisRepository repository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @InjectMocks
    private DiagnosisService service;

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
    @DisplayName("Deve criar diagnostico para prontuario existente")
    void testCreateSuccess() {
        DiagnosisRequest request = new DiagnosisRequest(recordId, "Hipertensao", doctorId, LocalDateTime.now(), "Lab", false);
        Diagnosis diagnosis = new Diagnosis(record, "Hipertensao", doctorId, LocalDateTime.now(), "Lab", false);

        when(medicalRecordRepository.findById(recordId)).thenReturn(Optional.of(record));
        when(repository.save(any(Diagnosis.class))).thenReturn(diagnosis);

        Diagnosis created = service.create(request);

        assertNotNull(created);
        assertEquals("Hipertensao", created.getDescription());
        verify(repository).save(any(Diagnosis.class));
    }

    @Test
    @DisplayName("Deve buscar diagnostico por ID")
    void testGetById() {
        UUID diagId = UUID.randomUUID();
        Diagnosis diagnosis = new Diagnosis(record, "Hipertensao", doctorId, LocalDateTime.now(), "Lab", false);
        when(repository.findByIdWithDetails(diagId)).thenReturn(Optional.of(diagnosis));

        Diagnosis found = service.getById(diagId);

        assertNotNull(found);
        assertEquals("Hipertensao", found.getDescription());
    }

    @Test
    @DisplayName("Deve listar diagnosticos por filtro")
    void testList() {
        Diagnosis diagnosis = new Diagnosis(record, "Hipertensao", doctorId, LocalDateTime.now(), "Lab", true);
        when(repository.findByFilter(recordId, null, doctorId, true)).thenReturn(List.of(diagnosis));

        List<Diagnosis> list = service.list(recordId, null, doctorId, true);

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("Deve validar diagnostico")
    void testValidate() {
        UUID diagId = UUID.randomUUID();
        Diagnosis diagnosis = new Diagnosis(record, "Hipertensao", doctorId, LocalDateTime.now(), "Lab", false);
        when(repository.findByIdWithDetails(diagId)).thenReturn(Optional.of(diagnosis));
        when(repository.save(any(Diagnosis.class))).thenReturn(diagnosis);

        Diagnosis validated = service.validate(diagId, true);

        assertTrue(validated.isValidated());
        verify(repository).save(diagnosis);
    }

    @Test
    @DisplayName("Deve deletar diagnostico existente")
    void testDelete() {
        UUID diagId = UUID.randomUUID();
        Diagnosis diagnosis = new Diagnosis(record, "Hipertensao", doctorId, LocalDateTime.now(), "Lab", false);
        when(repository.findByIdWithDetails(diagId)).thenReturn(Optional.of(diagnosis));

        service.delete(diagId);

        verify(repository).delete(diagnosis);
    }
}

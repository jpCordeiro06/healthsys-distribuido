package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.MedicalRecordRequest;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.grpc.PatientGrpcClient;
import br.edu.healthsys.record.repository.DiagnosisRepository;
import br.edu.healthsys.record.repository.ExamResultRepository;
import br.edu.healthsys.record.repository.MedicalExamRepository;
import br.edu.healthsys.record.repository.MedicalRecordRepository;
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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository repository;

    @Mock
    private MedicalExamRepository medicalExamRepository;

    @Mock
    private ExamResultRepository examResultRepository;

    @Mock
    private DiagnosisRepository diagnosisRepository;

    @Mock
    private PatientGrpcClient patientGrpcClient;

    @InjectMocks
    private MedicalRecordService service;

    private UUID patientId;
    private MedicalRecord record;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        record = new MedicalRecord(patientId);
    }

    @Test
    @DisplayName("Deve criar prontuario quando paciente existir")
    void testCreateSuccess() {
        MedicalRecordRequest request = new MedicalRecordRequest(patientId);
        when(repository.existsByPatientId(patientId)).thenReturn(false);
        when(repository.save(any(MedicalRecord.class))).thenReturn(record);

        MedicalRecord created = service.create(request);

        assertNotNull(created);
        assertEquals(patientId, created.getPatientId());
        verify(patientGrpcClient).validatePatientExists(patientId);
        verify(repository).save(any(MedicalRecord.class));
    }

    @Test
    @DisplayName("Deve lancar CONFLICT ao tentar criar prontuario duplicado para o mesmo paciente")
    void testCreateDuplicateConflict() {
        MedicalRecordRequest request = new MedicalRecordRequest(patientId);
        when(repository.existsByPatientId(patientId)).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.create(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lancar CONFLICT ao tentar criar prontuario e colidir por DuplicateKeyException")
    void testCreateDuplicateKeyExceptionConflict() {
        MedicalRecordRequest request = new MedicalRecordRequest(patientId);
        when(repository.existsByPatientId(patientId)).thenReturn(false);
        when(repository.save(any(MedicalRecord.class))).thenThrow(new DuplicateKeyException("duplicate key"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.create(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    @DisplayName("Deve buscar prontuario por ID")
    void testGetById() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdWithDetails(id)).thenReturn(Optional.of(record));

        MedicalRecord found = service.getById(id);

        assertNotNull(found);
        assertEquals(patientId, found.getPatientId());
    }

    @Test
    @DisplayName("Deve lancar NOT_FOUND quando prontuario nao existir")
    void testGetByIdNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdWithDetails(id)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getById(id));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("Deve retornar prontuario existente ao buscar por ID do paciente")
    void testGetByPatientIdExisting() {
        when(repository.findByPatientId(patientId)).thenReturn(Optional.of(record));

        MedicalRecord result = service.getByPatientId(patientId);

        assertNotNull(result);
        assertEquals(patientId, result.getPatientId());
        verify(patientGrpcClient, never()).validatePatientExists(any());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Deve criar prontuario quando buscar por ID do paciente e prontuario nao existir mas paciente existir")
    void testGetByPatientIdWhenNotExistsCreatesRecord() {
        when(repository.findByPatientId(patientId)).thenReturn(Optional.empty());
        when(repository.save(any(MedicalRecord.class))).thenReturn(record);

        MedicalRecord result = service.getByPatientId(patientId);

        assertNotNull(result);
        assertEquals(patientId, result.getPatientId());
        verify(patientGrpcClient).validatePatientExists(patientId);
        verify(repository).save(any(MedicalRecord.class));
    }

    @Test
    @DisplayName("Deve recuperar prontuario existente quando houver colisão por DuplicateKeyException em getByPatientId")
    void testGetByPatientIdConcurrentDuplicateKeyExceptionRecovers() {
        when(repository.findByPatientId(patientId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(record));
        when(repository.save(any(MedicalRecord.class))).thenThrow(new DuplicateKeyException("duplicate key"));

        MedicalRecord result = service.getByPatientId(patientId);

        assertNotNull(result);
        assertEquals(patientId, result.getPatientId());
        verify(patientGrpcClient).validatePatientExists(patientId);
        verify(repository).save(any(MedicalRecord.class));
        verify(repository, times(2)).findByPatientId(patientId);
    }

    @Test
    @DisplayName("Deve lancar INTERNAL_SERVER_ERROR quando houver DuplicateKeyException e falhar ao recuperar")
    void testGetByPatientIdConcurrentDuplicateKeyExceptionFailsRecovery() {
        when(repository.findByPatientId(patientId)).thenReturn(Optional.empty());
        when(repository.save(any(MedicalRecord.class))).thenThrow(new DuplicateKeyException("duplicate key"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getByPatientId(patientId));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, ex.getStatusCode());
    }

    @Test
    @DisplayName("Deve lancar NOT_FOUND ao buscar por ID do paciente quando paciente nao existir")
    void testGetByPatientIdWhenPatientNotExists() {
        when(repository.findByPatientId(patientId)).thenReturn(Optional.empty());
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente nao encontrado."))
                .when(patientGrpcClient).validatePatientExists(patientId);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getByPatientId(patientId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Deve buscar ou criar prontuario por ID do paciente")
    void testGetOrCreateByPatientId() {
        when(repository.findByPatientId(patientId)).thenReturn(Optional.empty());
        when(repository.save(any(MedicalRecord.class))).thenReturn(record);

        MedicalRecord result = service.getOrCreateByPatientId(patientId);

        assertNotNull(result);
        assertEquals(patientId, result.getPatientId());
        verify(patientGrpcClient).validatePatientExists(patientId);
    }

    @Test
    @DisplayName("Deve listar prontuarios por filtro")
    void testList() {
        when(repository.findByFilter(patientId)).thenReturn(List.of(record));

        List<MedicalRecord> list = service.list(patientId);

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("Deve deletar prontuario existente")
    void testDelete() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdWithDetails(id)).thenReturn(Optional.of(record));

        service.delete(id);

        verify(repository).delete(record);
    }
}

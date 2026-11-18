package br.edu.healthsys.patient.grpc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.patient.domain.Patient;
import br.edu.healthsys.patient.repository.PatientRepository;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatientGrpcServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private StreamObserver<PatientResponseProto> patientResponseObserver;

    @Mock
    private StreamObserver<CheckPatientExistsResponse> existsResponseObserver;

    @Captor
    private ArgumentCaptor<PatientResponseProto> patientResponseCaptor;

    @Captor
    private ArgumentCaptor<CheckPatientExistsResponse> existsResponseCaptor;

    @Captor
    private ArgumentCaptor<Throwable> errorCaptor;

    private PatientGrpcServiceImpl grpcService;

    @BeforeEach
    void setUp() {
        grpcService = new PatientGrpcServiceImpl(patientRepository);
    }

    @Test
    void shouldReturnPatientWhenFound() {
        UUID id = UUID.randomUUID();
        Patient patient = new Patient(id, "Carlos Silva", "12345678901", LocalDate.of(1990, 5, 15), "M", "11987654321");

        when(patientRepository.findById(id)).thenReturn(Optional.of(patient));

        GetPatientRequest request = GetPatientRequest.newBuilder().setId(id.toString()).build();
        grpcService.getPatient(request, patientResponseObserver);

        verify(patientResponseObserver).onNext(patientResponseCaptor.capture());
        verify(patientResponseObserver).onCompleted();

        PatientResponseProto response = patientResponseCaptor.getValue();
        assertEquals("Carlos Silva", response.getNome());
        assertEquals("12345678901", response.getCpf());
        assertEquals("1990-05-15", response.getDataNascimento());
        assertEquals("M", response.getSexo());
        assertEquals("11987654321", response.getTelefone());
    }

    @Test
    void shouldReturnNotFoundWhenPatientDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(patientRepository.findById(id)).thenReturn(Optional.empty());

        GetPatientRequest request = GetPatientRequest.newBuilder().setId(id.toString()).build();
        grpcService.getPatient(request, patientResponseObserver);

        verify(patientResponseObserver).onError(errorCaptor.capture());
        assertTrue(errorCaptor.getValue() instanceof StatusRuntimeException);
        StatusRuntimeException exception = (StatusRuntimeException) errorCaptor.getValue();
        assertEquals(Status.Code.NOT_FOUND, exception.getStatus().getCode());
    }

    @Test
    void shouldReturnInvalidArgumentWhenIdIsInvalid() {
        GetPatientRequest request = GetPatientRequest.newBuilder().setId("invalid-uuid").build();
        grpcService.getPatient(request, patientResponseObserver);

        verify(patientResponseObserver).onError(errorCaptor.capture());
        assertTrue(errorCaptor.getValue() instanceof StatusRuntimeException);
        StatusRuntimeException exception = (StatusRuntimeException) errorCaptor.getValue();
        assertEquals(Status.Code.INVALID_ARGUMENT, exception.getStatus().getCode());
    }

    @Test
    void shouldReturnTrueWhenPatientExists() {
        UUID id = UUID.randomUUID();
        when(patientRepository.existsById(id)).thenReturn(true);

        CheckPatientExistsRequest request = CheckPatientExistsRequest.newBuilder().setId(id.toString()).build();
        grpcService.checkPatientExists(request, existsResponseObserver);

        verify(existsResponseObserver).onNext(existsResponseCaptor.capture());
        verify(existsResponseObserver).onCompleted();

        assertTrue(existsResponseCaptor.getValue().getExists());
    }

    @Test
    void shouldReturnFalseWhenPatientDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(patientRepository.existsById(id)).thenReturn(false);

        CheckPatientExistsRequest request = CheckPatientExistsRequest.newBuilder().setId(id.toString()).build();
        grpcService.checkPatientExists(request, existsResponseObserver);

        verify(existsResponseObserver).onNext(existsResponseCaptor.capture());
        verify(existsResponseObserver).onCompleted();

        assertFalse(existsResponseCaptor.getValue().getExists());
    }

    @Test
    void shouldReturnFalseWhenCheckExistsReceivesInvalidUuid() {
        CheckPatientExistsRequest request = CheckPatientExistsRequest.newBuilder().setId("not-a-uuid").build();
        grpcService.checkPatientExists(request, existsResponseObserver);

        verify(existsResponseObserver).onNext(existsResponseCaptor.capture());
        verify(existsResponseObserver).onCompleted();

        assertFalse(existsResponseCaptor.getValue().getExists());
    }
}

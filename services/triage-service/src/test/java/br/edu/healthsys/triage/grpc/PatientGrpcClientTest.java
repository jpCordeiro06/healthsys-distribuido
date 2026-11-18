package br.edu.healthsys.triage.grpc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.patient.grpc.CheckPatientExistsRequest;
import br.edu.healthsys.patient.grpc.CheckPatientExistsResponse;
import br.edu.healthsys.patient.grpc.GetPatientRequest;
import br.edu.healthsys.patient.grpc.PatientGrpcServiceGrpc;
import br.edu.healthsys.patient.grpc.PatientResponseProto;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PatientGrpcClientTest {

    @Mock
    private PatientGrpcServiceGrpc.PatientGrpcServiceBlockingStub blockingStub;

    private PatientGrpcClient client;

    @BeforeEach
    void setUp() {
        client = new PatientGrpcClient(blockingStub);
    }

    @Test
    void shouldReturnTrueWhenPatientExists() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenReturn(CheckPatientExistsResponse.newBuilder().setExists(true).build());

        boolean result = client.exists(id);

        assertTrue(result);
        verify(blockingStub).checkPatientExists(any(CheckPatientExistsRequest.class));
    }

    @Test
    void shouldReturnFalseWhenPatientDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenReturn(CheckPatientExistsResponse.newBuilder().setExists(false).build());

        boolean result = client.exists(id);

        assertFalse(result);
    }

    @Test
    void shouldReturnFalseWhenIdIsNull() {
        boolean result = client.exists(null);

        assertFalse(result);
    }

    @Test
    void shouldThrowServiceUnavailableWhenGrpcFailsOnExists() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.UNAVAILABLE));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> client.exists(id));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }

    @Test
    void shouldReturnPatientWhenFound() {
        UUID id = UUID.randomUUID();
        PatientResponseProto responseProto = PatientResponseProto.newBuilder()
                .setId(id.toString())
                .setNome("Maria Silva")
                .setCpf("98765432100")
                .build();

        when(blockingStub.getPatient(any(GetPatientRequest.class))).thenReturn(responseProto);

        Optional<PatientResponseProto> result = client.getPatient(id);

        assertTrue(result.isPresent());
        assertEquals("Maria Silva", result.get().getNome());
    }

    @Test
    void shouldReturnEmptyWhenPatientNotFoundOnGetPatient() {
        UUID id = UUID.randomUUID();
        when(blockingStub.getPatient(any(GetPatientRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.NOT_FOUND));

        Optional<PatientResponseProto> result = client.getPatient(id);

        assertTrue(result.isEmpty());
    }

    @Test
    void shouldValidatePatientExistsSuccessfully() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenReturn(CheckPatientExistsResponse.newBuilder().setExists(true).build());

        client.validatePatientExists(id);
    }

    @Test
    void shouldThrowNotFoundOnValidateWhenPatientDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenReturn(CheckPatientExistsResponse.newBuilder().setExists(false).build());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> client.validatePatientExists(id));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void shouldThrowBadRequestOnValidateWhenIdIsNull() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> client.validatePatientExists(null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void shouldInstantiateAndShutdownWithHostAndPortConstructor() {
        PatientGrpcClient hostClient = new PatientGrpcClient("localhost", 9082);
        hostClient.shutdown();
    }
}

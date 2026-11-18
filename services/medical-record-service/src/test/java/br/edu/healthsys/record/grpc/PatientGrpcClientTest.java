package br.edu.healthsys.record.grpc;

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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
    @DisplayName("Deve retornar true quando paciente existe no gRPC")
    void testExistsTrue() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenReturn(CheckPatientExistsResponse.newBuilder().setExists(true).build());

        assertTrue(client.exists(id));
    }

    @Test
    @DisplayName("Deve retornar false quando id do paciente for nulo")
    void testExistsNull() {
        assertFalse(client.exists(null));
    }

    @Test
    @DisplayName("Deve lancar SERVICE_UNAVAILABLE quando gRPC falhar no exists")
    void testExistsError() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenThrow(new StatusRuntimeException(Status.UNAVAILABLE));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> client.exists(id));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }

    @Test
    @DisplayName("Deve obter paciente com sucesso")
    void testGetPatientSuccess() {
        UUID id = UUID.randomUUID();
        PatientResponseProto proto = PatientResponseProto.newBuilder()
                .setId(id.toString())
                .setNome("Maria Silva")
                .build();

        when(blockingStub.getPatient(any(GetPatientRequest.class))).thenReturn(proto);

        Optional<PatientResponseProto> result = client.getPatient(id);
        assertTrue(result.isPresent());
        assertEquals("Maria Silva", result.get().getNome());
    }

    @Test
    @DisplayName("Deve lancar NOT_FOUND quando validatePatientExists falhar")
    void testValidatePatientExistsNotFound() {
        UUID id = UUID.randomUUID();
        when(blockingStub.checkPatientExists(any(CheckPatientExistsRequest.class)))
                .thenReturn(CheckPatientExistsResponse.newBuilder().setExists(false).build());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> client.validatePatientExists(id));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    @DisplayName("Deve encerrar sem lancar excecao")
    void testShutdown() {
        assertDoesNotThrow(() -> client.shutdown());
    }
}

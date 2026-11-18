package br.edu.healthsys.record.grpc;

import br.edu.healthsys.patient.grpc.CheckPatientExistsRequest;
import br.edu.healthsys.patient.grpc.CheckPatientExistsResponse;
import br.edu.healthsys.patient.grpc.GetPatientRequest;
import br.edu.healthsys.patient.grpc.PatientGrpcServiceGrpc;
import br.edu.healthsys.patient.grpc.PatientResponseProto;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import jakarta.annotation.PreDestroy;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PatientGrpcClient {

    private static final Logger log = LoggerFactory.getLogger(PatientGrpcClient.class);

    private final ManagedChannel channel;
    private final PatientGrpcServiceGrpc.PatientGrpcServiceBlockingStub blockingStub;

    @Autowired
    public PatientGrpcClient(
            @Value("${grpc.patient-service.host:localhost}") String host,
            @Value("${grpc.patient-service.port:9082}") int port
    ) {
        this.channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .build();
        this.blockingStub = PatientGrpcServiceGrpc.newBlockingStub(channel);
    }

    public PatientGrpcClient(PatientGrpcServiceGrpc.PatientGrpcServiceBlockingStub blockingStub) {
        this.channel = null;
        this.blockingStub = blockingStub;
    }

    public boolean exists(UUID patientId) {
        if (patientId == null) {
            return false;
        }
        try {
            CheckPatientExistsRequest request = CheckPatientExistsRequest.newBuilder()
                    .setId(patientId.toString())
                    .build();
            CheckPatientExistsResponse response = blockingStub.checkPatientExists(request);
            return response.getExists();
        } catch (StatusRuntimeException e) {
            log.error("gRPC error while checking patient existence: {}", e.getStatus(), e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Servico de pacientes indisponivel no momento.");
        }
    }

    public Optional<PatientResponseProto> getPatient(UUID patientId) {
        if (patientId == null) {
            return Optional.empty();
        }
        try {
            GetPatientRequest request = GetPatientRequest.newBuilder()
                    .setId(patientId.toString())
                    .build();
            PatientResponseProto response = blockingStub.getPatient(request);
            return Optional.of(response);
        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == Status.Code.NOT_FOUND) {
                return Optional.empty();
            }
            log.error("gRPC error while fetching patient: {}", e.getStatus(), e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Servico de pacientes indisponivel no momento.");
        }
    }

    public void validatePatientExists(UUID patientId) {
        if (patientId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O ID do paciente e obrigatorio.");
        }
        if (!exists(patientId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente nao encontrado.");
        }
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            try {
                channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                channel.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }
}

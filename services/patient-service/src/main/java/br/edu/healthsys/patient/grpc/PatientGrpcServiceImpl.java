package br.edu.healthsys.patient.grpc;

import br.edu.healthsys.patient.domain.Patient;
import br.edu.healthsys.patient.repository.PatientRepository;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientGrpcServiceImpl extends PatientGrpcServiceGrpc.PatientGrpcServiceImplBase {

    private final PatientRepository patientRepository;

    public PatientGrpcServiceImpl(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public void getPatient(GetPatientRequest request, StreamObserver<PatientResponseProto> responseObserver) {
        UUID patientId;
        try {
            patientId = UUID.fromString(request.getId());
        } catch (IllegalArgumentException e) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("UUID do paciente invalido: " + request.getId())
                    .asRuntimeException());
            return;
        }

        Optional<Patient> optionalPatient = patientRepository.findById(patientId);
        if (optionalPatient.isEmpty()) {
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription("Paciente nao encontrado.")
                    .asRuntimeException());
            return;
        }

        Patient patient = optionalPatient.get();
        PatientResponseProto response = PatientResponseProto.newBuilder()
                .setId(patient.getId().toString())
                .setNome(patient.getNome() != null ? patient.getNome() : "")
                .setCpf(patient.getCpf() != null ? patient.getCpf() : "")
                .setDataNascimento(patient.getDataNascimento() != null ? patient.getDataNascimento().toString() : "")
                .setSexo(patient.getSexo() != null ? patient.getSexo() : "")
                .setTelefone(patient.getTelefone() != null ? patient.getTelefone() : "")
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }

    @Override
    @Transactional(readOnly = true)
    public void checkPatientExists(CheckPatientExistsRequest request, StreamObserver<CheckPatientExistsResponse> responseObserver) {
        UUID patientId;
        try {
            patientId = UUID.fromString(request.getId());
        } catch (IllegalArgumentException e) {
            responseObserver.onNext(CheckPatientExistsResponse.newBuilder().setExists(false).build());
            responseObserver.onCompleted();
            return;
        }

        boolean exists = patientRepository.existsById(patientId);
        responseObserver.onNext(CheckPatientExistsResponse.newBuilder().setExists(exists).build());
        responseObserver.onCompleted();
    }
}

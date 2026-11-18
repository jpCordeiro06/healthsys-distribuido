package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.DiagnosisRequest;
import br.edu.healthsys.record.domain.Diagnosis;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.repository.DiagnosisRepository;
import br.edu.healthsys.record.repository.MedicalRecordRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DiagnosisService {

    private final DiagnosisRepository repository;
    private final MedicalRecordRepository medicalRecordRepository;

    public DiagnosisService(
            DiagnosisRepository repository,
            MedicalRecordRepository medicalRecordRepository
    ) {
        this.repository = repository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    public Diagnosis create(DiagnosisRequest request) {
        if (request.medicalRecordId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O ID do prontuario e obrigatorio.");
        }
        if (request.description() == null || request.description().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A descricao do diagnostico e obrigatoria.");
        }

        MedicalRecord record = medicalRecordRepository.findById(request.medicalRecordId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prontuario nao encontrado."));

        Diagnosis diagnosis = new Diagnosis(
                record,
                request.description().trim(),
                request.doctorId(),
                request.date(),
                request.laboratoryName(),
                request.validated() != null ? request.validated() : false
        );

        return repository.save(diagnosis);
    }

    public Diagnosis getById(UUID id) {
        return repository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diagnostico nao encontrado."));
    }

    public List<Diagnosis> list(UUID medicalRecordId, UUID patientId, UUID doctorId, Boolean validated) {
        return repository.findByFilter(medicalRecordId, patientId, doctorId, validated);
    }

    public Diagnosis update(UUID id, DiagnosisRequest request) {
        Diagnosis diagnosis = getById(id);

        if (request.medicalRecordId() != null && !request.medicalRecordId().equals(diagnosis.getMedicalRecordId())) {
            MedicalRecord record = medicalRecordRepository.findById(request.medicalRecordId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prontuario nao encontrado."));
            diagnosis.setMedicalRecord(record);
        }

        diagnosis.update(
                request.description(),
                request.doctorId(),
                request.date(),
                request.laboratoryName(),
                request.validated()
        );

        return repository.save(diagnosis);
    }

    public Diagnosis validate(UUID id, boolean validated) {
        Diagnosis diagnosis = getById(id);
        diagnosis.setValidated(validated);
        return repository.save(diagnosis);
    }

    public void delete(UUID id) {
        Diagnosis diagnosis = getById(id);
        repository.delete(diagnosis);
    }
}

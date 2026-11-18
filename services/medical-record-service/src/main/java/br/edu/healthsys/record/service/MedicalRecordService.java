package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.MedicalRecordRequest;
import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.grpc.PatientGrpcClient;
import br.edu.healthsys.record.repository.DiagnosisRepository;
import br.edu.healthsys.record.repository.ExamResultRepository;
import br.edu.healthsys.record.repository.MedicalExamRepository;
import br.edu.healthsys.record.repository.MedicalRecordRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository repository;
    private final MedicalExamRepository medicalExamRepository;
    private final ExamResultRepository examResultRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final PatientGrpcClient patientGrpcClient;

    public MedicalRecordService(MedicalRecordRepository repository,
                                MedicalExamRepository medicalExamRepository,
                                ExamResultRepository examResultRepository,
                                DiagnosisRepository diagnosisRepository,
                                PatientGrpcClient patientGrpcClient) {
        this.repository = repository;
        this.medicalExamRepository = medicalExamRepository;
        this.examResultRepository = examResultRepository;
        this.diagnosisRepository = diagnosisRepository;
        this.patientGrpcClient = patientGrpcClient;
    }

    public MedicalRecord create(MedicalRecordRequest request) {
        if (request.patientId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O ID do paciente e obrigatorio.");
        }

        patientGrpcClient.validatePatientExists(request.patientId());

        if (repository.existsByPatientId(request.patientId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um prontuario cadastrado para este paciente.");
        }

        MedicalRecord record = new MedicalRecord(request.patientId());
        try {
            MedicalRecord saved = repository.save(record);
            populateDetails(saved);
            return saved;
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um prontuario cadastrado para este paciente.");
        }
    }

    public MedicalRecord getById(UUID id) {
        MedicalRecord record = repository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prontuario nao encontrado."));
        populateDetails(record);
        return record;
    }

    public MedicalRecord getByPatientId(UUID patientId) {
        if (patientId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O ID do paciente e obrigatorio.");
        }
        MedicalRecord record = repository.findByPatientId(patientId).orElseGet(() -> {
            patientGrpcClient.validatePatientExists(patientId);
            try {
                return repository.save(new MedicalRecord(patientId));
            } catch (DuplicateKeyException e) {
                return repository.findByPatientId(patientId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao recuperar prontuario."));
            }
        });
        populateDetails(record);
        return record;
    }

    public MedicalRecord getOrCreateByPatientId(UUID patientId) {
        return getByPatientId(patientId);
    }

    public List<MedicalRecord> list(UUID patientId) {
        List<MedicalRecord> records = repository.findByFilter(patientId);
        records.forEach(this::populateDetails);
        return records;
    }

    public void delete(UUID id) {
        MedicalRecord record = getById(id);
        List<MedicalExam> exams = medicalExamRepository.findByMedicalRecordIdOrderByDateDesc(id);
        for (MedicalExam exam : exams) {
            examResultRepository.deleteByMedicalExamId(exam.getId());
        }
        medicalExamRepository.deleteByMedicalRecordId(id);
        diagnosisRepository.deleteByMedicalRecordId(id);
        repository.delete(record);
    }

    private void populateDetails(MedicalRecord record) {
        if (record == null) {
            return;
        }
        List<MedicalExam> exams = medicalExamRepository.findByMedicalRecordIdOrderByDateDesc(record.getId());
        for (MedicalExam exam : exams) {
            exam.setResults(examResultRepository.findByMedicalExamIdOrderByResultDateDesc(exam.getId()));
        }
        record.setExams(exams);
        record.setDiagnoses(diagnosisRepository.findByMedicalRecordIdOrderByDateDesc(record.getId()));
    }
}

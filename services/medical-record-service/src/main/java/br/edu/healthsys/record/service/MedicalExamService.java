package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.MedicalExamRequest;
import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.event.MedicalExamRegisteredPayload;
import br.edu.healthsys.record.event.MedicalRecordEventProducer;
import br.edu.healthsys.record.repository.ExamResultRepository;
import br.edu.healthsys.record.repository.MedicalExamRepository;
import br.edu.healthsys.record.repository.MedicalRecordRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MedicalExamService {

    private final MedicalExamRepository repository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ExamResultRepository examResultRepository;
    private final MedicalRecordEventProducer eventProducer;

    public MedicalExamService(
            MedicalExamRepository repository,
            MedicalRecordRepository medicalRecordRepository,
            ExamResultRepository examResultRepository,
            MedicalRecordEventProducer eventProducer
    ) {
        this.repository = repository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.examResultRepository = examResultRepository;
        this.eventProducer = eventProducer;
    }

    public MedicalExam create(MedicalExamRequest request, String correlationId) {
        if (request.medicalRecordId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O ID do prontuario e obrigatorio.");
        }
        if (request.type() == null || request.type().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O tipo do exame e obrigatorio.");
        }

        MedicalRecord record = medicalRecordRepository.findById(request.medicalRecordId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prontuario nao encontrado."));

        MedicalExam exam = new MedicalExam(
                record,
                request.type().trim(),
                request.date(),
                request.doctorId(),
                request.hasResult() != null ? request.hasResult() : false
        );

        MedicalExam saved = repository.save(exam);
        populateDetails(saved);

        String doctorIdentifier = saved.getDoctorId() != null ? saved.getDoctorId().toString() : "MEDICO";
        eventProducer.publishMedicalExamRegistered(
                new MedicalExamRegisteredPayload(record.getPatientId(), saved.getType(), doctorIdentifier),
                correlationId
        );

        return saved;
    }

    public MedicalExam getById(UUID id) {
        MedicalExam exam = repository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exame nao encontrado."));
        populateDetails(exam);
        return exam;
    }

    public List<MedicalExam> list(UUID medicalRecordId, UUID patientId, UUID doctorId, String type, Boolean hasResult) {
        List<MedicalExam> exams = repository.findByFilter(medicalRecordId, patientId, doctorId, type, hasResult);
        exams.forEach(this::populateDetails);
        return exams;
    }

    public MedicalExam update(UUID id, MedicalExamRequest request) {
        MedicalExam exam = getById(id);

        if (request.medicalRecordId() != null && !request.medicalRecordId().equals(exam.getMedicalRecordId())) {
            MedicalRecord record = medicalRecordRepository.findById(request.medicalRecordId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prontuario nao encontrado."));
            exam.setMedicalRecord(record);
        }

        exam.update(
                request.type(),
                request.date(),
                request.doctorId(),
                request.hasResult()
        );

        MedicalExam saved = repository.save(exam);
        populateDetails(saved);
        return saved;
    }

    public void delete(UUID id) {
        MedicalExam exam = getById(id);
        examResultRepository.deleteByMedicalExamId(id);
        repository.delete(exam);
    }

    private void populateDetails(MedicalExam exam) {
        if (exam == null) {
            return;
        }
        exam.setResults(examResultRepository.findByMedicalExamIdOrderByResultDateDesc(exam.getId()));
    }
}

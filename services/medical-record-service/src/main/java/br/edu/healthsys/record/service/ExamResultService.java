package br.edu.healthsys.record.service;

import br.edu.healthsys.record.api.ExamResultRequest;
import br.edu.healthsys.record.domain.ExamResult;
import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.repository.ExamResultRepository;
import br.edu.healthsys.record.repository.MedicalExamRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExamResultService {

    private final ExamResultRepository repository;
    private final MedicalExamRepository medicalExamRepository;

    public ExamResultService(
            ExamResultRepository repository,
            MedicalExamRepository medicalExamRepository
    ) {
        this.repository = repository;
        this.medicalExamRepository = medicalExamRepository;
    }

    public ExamResult create(ExamResultRequest request) {
        if (request.medicalExamId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O ID do exame e obrigatorio.");
        }
        if (request.resultSummary() == null || request.resultSummary().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O resumo do resultado e obrigatorio.");
        }

        MedicalExam exam = medicalExamRepository.findById(request.medicalExamId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exame nao encontrado."));

        ExamResult result = new ExamResult(
                exam,
                request.resultDate(),
                request.resultSummary().trim(),
                request.detailedReport(),
                request.laboratoryName(),
                request.validated() != null ? request.validated() : false
        );

        ExamResult saved = repository.save(result);
        exam.setHasResult(true);
        medicalExamRepository.save(exam);

        return saved;
    }

    public ExamResult getById(UUID id) {
        return repository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resultado de exame nao encontrado."));
    }

    public List<ExamResult> list(UUID medicalExamId) {
        return repository.findByFilter(medicalExamId);
    }

    public ExamResult update(UUID id, ExamResultRequest request) {
        ExamResult result = getById(id);

        if (request.medicalExamId() != null && !request.medicalExamId().equals(result.getMedicalExamId())) {
            MedicalExam exam = medicalExamRepository.findById(request.medicalExamId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exame nao encontrado."));
            result.setMedicalExam(exam);
        }

        result.update(
                request.resultDate(),
                request.resultSummary(),
                request.detailedReport(),
                request.laboratoryName(),
                request.validated()
        );

        return repository.save(result);
    }

    public ExamResult validate(UUID id, boolean validated) {
        ExamResult result = getById(id);
        result.setValidated(validated);
        return repository.save(result);
    }

    public void delete(UUID id) {
        ExamResult result = getById(id);
        repository.delete(result);
        if (result.getMedicalExamId() != null) {
            List<ExamResult> remaining = repository.findByMedicalExamIdOrderByResultDateDesc(result.getMedicalExamId());
            medicalExamRepository.findById(result.getMedicalExamId()).ifPresent(exam -> {
                exam.setHasResult(!remaining.isEmpty());
                medicalExamRepository.save(exam);
            });
        }
    }
}

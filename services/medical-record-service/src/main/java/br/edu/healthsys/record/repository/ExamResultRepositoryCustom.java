package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.ExamResult;
import java.util.List;
import java.util.UUID;

public interface ExamResultRepositoryCustom {
    List<ExamResult> findByFilter(UUID medicalExamId);
}

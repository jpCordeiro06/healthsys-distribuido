package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.ExamResult;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamResultRepository extends MongoRepository<ExamResult, UUID>, ExamResultRepositoryCustom {

    List<ExamResult> findByMedicalExamIdOrderByResultDateDesc(UUID medicalExamId);

    void deleteByMedicalExamId(UUID medicalExamId);

    default Optional<ExamResult> findByIdWithDetails(UUID id) {
        return findById(id);
    }
}

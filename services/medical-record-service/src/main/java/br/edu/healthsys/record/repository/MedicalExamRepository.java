package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.MedicalExam;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicalExamRepository extends MongoRepository<MedicalExam, UUID>, MedicalExamRepositoryCustom {

    List<MedicalExam> findByMedicalRecordIdOrderByDateDesc(UUID medicalRecordId);

    List<MedicalExam> findByPatientIdOrderByDateDesc(UUID patientId);

    void deleteByMedicalRecordId(UUID medicalRecordId);

    default Optional<MedicalExam> findByIdWithDetails(UUID id) {
        return findById(id);
    }
}

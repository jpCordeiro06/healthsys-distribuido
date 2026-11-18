package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.MedicalRecord;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicalRecordRepository extends MongoRepository<MedicalRecord, UUID>, MedicalRecordRepositoryCustom {

    Optional<MedicalRecord> findByPatientId(UUID patientId);

    boolean existsByPatientId(UUID patientId);

    default Optional<MedicalRecord> findByIdWithDetails(UUID id) {
        return findById(id);
    }
}

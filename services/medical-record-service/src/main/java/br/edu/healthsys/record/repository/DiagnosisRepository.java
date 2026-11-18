package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.Diagnosis;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiagnosisRepository extends MongoRepository<Diagnosis, UUID>, DiagnosisRepositoryCustom {

    List<Diagnosis> findByMedicalRecordIdOrderByDateDesc(UUID medicalRecordId);

    List<Diagnosis> findByPatientIdOrderByDateDesc(UUID patientId);

    void deleteByMedicalRecordId(UUID medicalRecordId);

    default Optional<Diagnosis> findByIdWithDetails(UUID id) {
        return findById(id);
    }
}

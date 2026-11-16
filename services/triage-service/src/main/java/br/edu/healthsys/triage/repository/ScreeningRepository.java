package br.edu.healthsys.triage.repository;

import br.edu.healthsys.triage.domain.Screening;
import br.edu.healthsys.triage.domain.ScreeningStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScreeningRepository extends JpaRepository<Screening, UUID> {

    @EntityGraph(attributePaths = {"riskClassification", "symptoms"})
    List<Screening> findByPatientId(UUID patientId);

    @EntityGraph(attributePaths = {"riskClassification", "symptoms"})
    List<Screening> findByStatus(ScreeningStatus status);

    @EntityGraph(attributePaths = {"riskClassification", "symptoms"})
    List<Screening> findByDoctorId(UUID doctorId);

    @Override
    @EntityGraph(attributePaths = {"riskClassification", "symptoms"})
    List<Screening> findAll();

    @Override
    @EntityGraph(attributePaths = {"riskClassification", "symptoms"})
    Optional<Screening> findById(UUID id);

    @EntityGraph(attributePaths = {"riskClassification", "symptoms"})
    @Query("SELECT s FROM Screening s WHERE " +
           "(:patientId IS NULL OR s.patientId = :patientId) AND " +
           "(:status IS NULL OR s.status = :status)")
    List<Screening> findByFilter(@Param("patientId") UUID patientId, @Param("status") ScreeningStatus status);
}

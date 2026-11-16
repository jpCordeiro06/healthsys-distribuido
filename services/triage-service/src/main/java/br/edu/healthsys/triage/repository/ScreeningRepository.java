package br.edu.healthsys.triage.repository;

import br.edu.healthsys.triage.domain.Screening;
import br.edu.healthsys.triage.domain.ScreeningStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScreeningRepository extends JpaRepository<Screening, UUID> {
    List<Screening> findByPatientId(UUID patientId);
    List<Screening> findByStatus(ScreeningStatus status);
    List<Screening> findByDoctorId(UUID doctorId);

    @Query("SELECT s FROM Screening s WHERE " +
           "(:patientId IS NULL OR s.patientId = :patientId) AND " +
           "(:status IS NULL OR s.status = :status)")
    List<Screening> findByFilter(@Param("patientId") UUID patientId, @Param("status") ScreeningStatus status);
}

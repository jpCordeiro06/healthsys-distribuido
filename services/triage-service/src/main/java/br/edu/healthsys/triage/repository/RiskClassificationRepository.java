package br.edu.healthsys.triage.repository;

import br.edu.healthsys.triage.domain.RiskClassification;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskClassificationRepository extends JpaRepository<RiskClassification, UUID> {
    List<RiskClassification> findByActiveTrue();
    Optional<RiskClassification> findByNameIgnoreCase(String name);
}

package br.edu.healthsys.triage.repository;

import br.edu.healthsys.triage.domain.Symptom;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SymptomRepository extends JpaRepository<Symptom, UUID> {
    List<Symptom> findByActiveTrue();
    Optional<Symptom> findByNameIgnoreCase(String name);
    List<Symptom> findAllByIdIn(Collection<UUID> ids);
}

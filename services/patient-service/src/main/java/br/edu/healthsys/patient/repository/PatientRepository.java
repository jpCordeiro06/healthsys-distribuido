package br.edu.healthsys.patient.repository;

import br.edu.healthsys.patient.domain.Patient;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
}

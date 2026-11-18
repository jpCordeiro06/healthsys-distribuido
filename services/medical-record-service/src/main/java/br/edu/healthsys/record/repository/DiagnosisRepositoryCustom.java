package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.Diagnosis;
import java.util.List;
import java.util.UUID;

public interface DiagnosisRepositoryCustom {
    List<Diagnosis> findByFilter(UUID medicalRecordId, UUID patientId, UUID doctorId, Boolean validated);
}

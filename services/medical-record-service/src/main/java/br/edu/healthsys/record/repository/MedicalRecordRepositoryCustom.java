package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.MedicalRecord;
import java.util.List;
import java.util.UUID;

public interface MedicalRecordRepositoryCustom {
    List<MedicalRecord> findByFilter(UUID patientId);
}

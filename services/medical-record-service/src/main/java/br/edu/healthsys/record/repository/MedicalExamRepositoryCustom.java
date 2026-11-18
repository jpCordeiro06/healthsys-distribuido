package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.MedicalExam;
import java.util.List;
import java.util.UUID;

public interface MedicalExamRepositoryCustom {
    List<MedicalExam> findByFilter(UUID medicalRecordId, UUID patientId, UUID doctorId, String type, Boolean hasResult);
}

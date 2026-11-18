package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "medical_exams")
public class MedicalExam {

    @Id
    private UUID id;

    @Indexed
    private UUID medicalRecordId;

    @Indexed
    private UUID patientId;

    private String type;
    private LocalDateTime date;

    @Indexed
    private UUID doctorId;

    private boolean hasResult = false;

    @Transient
    private MedicalRecord medicalRecord;

    @Transient
    private List<ExamResult> results = new ArrayList<>();

    public MedicalExam() {
        this.date = LocalDateTime.now();
    }

    public MedicalExam(UUID id) {
        this.id = id;
        this.date = LocalDateTime.now();
    }

    public MedicalExam(MedicalRecord medicalRecord, String type, LocalDateTime date, UUID doctorId, boolean hasResult) {
        this.setMedicalRecord(medicalRecord);
        this.type = type;
        this.date = date != null ? date : LocalDateTime.now();
        this.doctorId = doctorId;
        this.hasResult = hasResult;
    }

    public MedicalExam(UUID id, MedicalRecord medicalRecord, String type, LocalDateTime date, UUID doctorId, boolean hasResult) {
        this.id = id;
        this.setMedicalRecord(medicalRecord);
        this.type = type;
        this.date = date != null ? date : LocalDateTime.now();
        this.doctorId = doctorId;
        this.hasResult = hasResult;
    }

    public MedicalExam(UUID id, UUID medicalRecordId, UUID patientId, String type, LocalDateTime date, UUID doctorId, boolean hasResult) {
        this.id = id;
        this.medicalRecordId = medicalRecordId;
        this.patientId = patientId;
        this.type = type;
        this.date = date != null ? date : LocalDateTime.now();
        this.doctorId = doctorId;
        this.hasResult = hasResult;
    }

    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (date == null) {
            date = LocalDateTime.now();
        }
    }

    public void update(String type, LocalDateTime date, UUID doctorId, Boolean hasResult) {
        if (type != null && !type.isBlank()) {
            this.type = type;
        }
        if (date != null) {
            this.date = date;
        }
        if (doctorId != null) {
            this.doctorId = doctorId;
        }
        if (hasResult != null) {
            this.hasResult = hasResult;
        }
    }

    public void addResult(ExamResult result) {
        if (result != null) {
            result.setMedicalExam(this);
            this.results.add(result);
            this.hasResult = true;
        }
    }

    public void removeResult(ExamResult result) {
        if (result != null) {
            this.results.remove(result);
            result.setMedicalExam(null);
            this.hasResult = !this.results.isEmpty();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getMedicalRecordId() {
        if (medicalRecordId != null) {
            return medicalRecordId;
        }
        return medicalRecord != null ? medicalRecord.getId() : null;
    }

    public void setMedicalRecordId(UUID medicalRecordId) {
        this.medicalRecordId = medicalRecordId;
    }

    public UUID getPatientId() {
        if (patientId != null) {
            return patientId;
        }
        return medicalRecord != null ? medicalRecord.getPatientId() : null;
    }

    public void setPatientId(UUID patientId) {
        this.patientId = patientId;
    }

    public MedicalRecord getMedicalRecord() {
        if (medicalRecord != null) {
            return medicalRecord;
        }
        if (medicalRecordId != null) {
            return new MedicalRecord(medicalRecordId, patientId, null, null);
        }
        return null;
    }

    public void setMedicalRecord(MedicalRecord medicalRecord) {
        this.medicalRecord = medicalRecord;
        if (medicalRecord != null) {
            this.medicalRecordId = medicalRecord.getId();
            this.patientId = medicalRecord.getPatientId();
        }
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public UUID getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(UUID doctorId) {
        this.doctorId = doctorId;
    }

    public boolean isHasResult() {
        return hasResult;
    }

    public void setHasResult(boolean hasResult) {
        this.hasResult = hasResult;
    }

    public List<ExamResult> getResults() {
        return results;
    }

    public void setResults(List<ExamResult> results) {
        this.results = results != null ? results : new ArrayList<>();
    }
}

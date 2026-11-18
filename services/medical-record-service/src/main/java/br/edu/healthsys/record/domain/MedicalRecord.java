package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "medical_records")
public class MedicalRecord {

    @Id
    private UUID id;

    @Indexed(unique = true)
    private UUID patientId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    private List<MedicalExam> exams = new ArrayList<>();

    @Transient
    private List<Diagnosis> diagnoses = new ArrayList<>();

    public MedicalRecord() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public MedicalRecord(UUID patientId) {
        this.patientId = patientId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public MedicalRecord(UUID id, UUID patientId) {
        this.id = id;
        this.patientId = patientId;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public MedicalRecord(UUID id, UUID patientId, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.patientId = patientId;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    public void addExam(MedicalExam exam) {
        if (exam != null) {
            exam.setMedicalRecord(this);
            this.exams.add(exam);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void removeExam(MedicalExam exam) {
        if (exam != null) {
            this.exams.remove(exam);
            exam.setMedicalRecord(null);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void addDiagnosis(Diagnosis diagnosis) {
        if (diagnosis != null) {
            diagnosis.setMedicalRecord(this);
            this.diagnoses.add(diagnosis);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void removeDiagnosis(Diagnosis diagnosis) {
        if (diagnosis != null) {
            this.diagnoses.remove(diagnosis);
            diagnosis.setMedicalRecord(null);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPatientId() {
        return patientId;
    }

    public void setPatientId(UUID patientId) {
        this.patientId = patientId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<MedicalExam> getExams() {
        return exams;
    }

    public void setExams(List<MedicalExam> exams) {
        this.exams = exams != null ? exams : new ArrayList<>();
    }

    public List<Diagnosis> getDiagnoses() {
        return diagnoses;
    }

    public void setDiagnoses(List<Diagnosis> diagnoses) {
        this.diagnoses = diagnoses != null ? diagnoses : new ArrayList<>();
    }
}

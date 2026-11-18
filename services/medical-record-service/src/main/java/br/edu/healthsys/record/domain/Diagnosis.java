package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "diagnoses")
public class Diagnosis {

    @Id
    private UUID id;

    @Indexed
    private UUID medicalRecordId;

    @Indexed
    private UUID patientId;

    private String description;

    @Indexed
    private UUID doctorId;

    private LocalDateTime date;
    private String laboratoryName;
    private boolean validated = false;

    @Transient
    private MedicalRecord medicalRecord;

    public Diagnosis() {
        this.date = LocalDateTime.now();
    }

    public Diagnosis(MedicalRecord medicalRecord, String description, UUID doctorId,
                     LocalDateTime date, String laboratoryName, boolean validated) {
        this.setMedicalRecord(medicalRecord);
        this.description = description;
        this.doctorId = doctorId;
        this.date = date != null ? date : LocalDateTime.now();
        this.laboratoryName = laboratoryName;
        this.validated = validated;
    }

    public Diagnosis(UUID id, MedicalRecord medicalRecord, String description, UUID doctorId,
                     LocalDateTime date, String laboratoryName, boolean validated) {
        this.id = id;
        this.setMedicalRecord(medicalRecord);
        this.description = description;
        this.doctorId = doctorId;
        this.date = date != null ? date : LocalDateTime.now();
        this.laboratoryName = laboratoryName;
        this.validated = validated;
    }

    public Diagnosis(UUID id, UUID medicalRecordId, UUID patientId, String description, UUID doctorId,
                     LocalDateTime date, String laboratoryName, boolean validated) {
        this.id = id;
        this.medicalRecordId = medicalRecordId;
        this.patientId = patientId;
        this.description = description;
        this.doctorId = doctorId;
        this.date = date != null ? date : LocalDateTime.now();
        this.laboratoryName = laboratoryName;
        this.validated = validated;
    }

    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (date == null) {
            date = LocalDateTime.now();
        }
    }

    public void update(String description, UUID doctorId, LocalDateTime date,
                       String laboratoryName, Boolean validated) {
        if (description != null && !description.isBlank()) {
            this.description = description;
        }
        if (doctorId != null) {
            this.doctorId = doctorId;
        }
        if (date != null) {
            this.date = date;
        }
        if (laboratoryName != null) {
            this.laboratoryName = laboratoryName;
        }
        if (validated != null) {
            this.validated = validated;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(UUID doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getLaboratoryName() {
        return laboratoryName;
    }

    public void setLaboratoryName(String laboratoryName) {
        this.laboratoryName = laboratoryName;
    }

    public boolean isValidated() {
        return validated;
    }

    public void setValidated(boolean validated) {
        this.validated = validated;
    }
}

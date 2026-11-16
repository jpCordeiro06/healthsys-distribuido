package br.edu.healthsys.triage.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "screening")
public class Screening {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "doctor_id")
    private UUID doctorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_classification_id")
    private RiskClassification riskClassification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ScreeningStatus status = ScreeningStatus.AGUARDANDO;

    @Column(name = "screening_date", nullable = false)
    private LocalDateTime screeningDate;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "screening_symptom",
            joinColumns = @JoinColumn(name = "screening_id"),
            inverseJoinColumns = @JoinColumn(name = "symptom_id")
    )
    private Set<Symptom> symptoms = new HashSet<>();

    protected Screening() {}

    public Screening(UUID patientId, UUID doctorId, RiskClassification riskClassification,
                     ScreeningStatus status, LocalDateTime screeningDate, String notes, Set<Symptom> symptoms) {
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.riskClassification = riskClassification;
        this.status = status != null ? status : ScreeningStatus.AGUARDANDO;
        this.screeningDate = screeningDate != null ? screeningDate : LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.notes = notes;
        if (symptoms != null) {
            this.symptoms.addAll(symptoms);
        }
    }

    @PrePersist
    void prePersist() {
        if (screeningDate == null) {
            screeningDate = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ScreeningStatus.AGUARDANDO;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void update(UUID doctorId, RiskClassification riskClassification,
                       ScreeningStatus status, String notes, Set<Symptom> symptoms) {
        this.doctorId = doctorId;
        this.riskClassification = riskClassification;
        if (status != null) {
            this.status = status;
        }
        this.notes = notes;
        if (symptoms != null) {
            this.symptoms.clear();
            this.symptoms.addAll(symptoms);
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void updateStatus(ScreeningStatus status) {
        if (status != null) {
            this.status = status;
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void addSymptom(Symptom symptom) {
        if (symptom != null) {
            this.symptoms.add(symptom);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void removeSymptom(Symptom symptom) {
        if (symptom != null) {
            this.symptoms.remove(symptom);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getPatientId() {
        return patientId;
    }

    public UUID getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(UUID doctorId) {
        this.doctorId = doctorId;
    }

    public RiskClassification getRiskClassification() {
        return riskClassification;
    }

    public void setRiskClassification(RiskClassification riskClassification) {
        this.riskClassification = riskClassification;
    }

    public ScreeningStatus getStatus() {
        return status;
    }

    public void setStatus(ScreeningStatus status) {
        this.status = status;
    }

    public LocalDateTime getScreeningDate() {
        return screeningDate;
    }

    public void setScreeningDate(LocalDateTime screeningDate) {
        this.screeningDate = screeningDate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Set<Symptom> getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(Set<Symptom> symptoms) {
        this.symptoms = symptoms != null ? symptoms : new HashSet<>();
    }
}

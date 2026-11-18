package br.edu.healthsys.record.domain;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "exam_results")
public class ExamResult {

    @Id
    private UUID id;

    @Indexed
    private UUID medicalExamId;

    private LocalDateTime resultDate;
    private String resultSummary;
    private String detailedReport;
    private String laboratoryName;
    private boolean validated = false;

    @Transient
    private MedicalExam medicalExam;

    public ExamResult() {
        this.resultDate = LocalDateTime.now();
    }

    public ExamResult(MedicalExam medicalExam, LocalDateTime resultDate, String resultSummary,
                      String detailedReport, String laboratoryName, boolean validated) {
        this.setMedicalExam(medicalExam);
        this.resultDate = resultDate != null ? resultDate : LocalDateTime.now();
        this.resultSummary = resultSummary;
        this.detailedReport = detailedReport;
        this.laboratoryName = laboratoryName;
        this.validated = validated;
    }

    public ExamResult(UUID id, MedicalExam medicalExam, LocalDateTime resultDate, String resultSummary,
                      String detailedReport, String laboratoryName, boolean validated) {
        this.id = id;
        this.setMedicalExam(medicalExam);
        this.resultDate = resultDate != null ? resultDate : LocalDateTime.now();
        this.resultSummary = resultSummary;
        this.detailedReport = detailedReport;
        this.laboratoryName = laboratoryName;
        this.validated = validated;
    }

    public ExamResult(UUID id, UUID medicalExamId, LocalDateTime resultDate, String resultSummary,
                      String detailedReport, String laboratoryName, boolean validated) {
        this.id = id;
        this.medicalExamId = medicalExamId;
        this.resultDate = resultDate != null ? resultDate : LocalDateTime.now();
        this.resultSummary = resultSummary;
        this.detailedReport = detailedReport;
        this.laboratoryName = laboratoryName;
        this.validated = validated;
    }

    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (resultDate == null) {
            resultDate = LocalDateTime.now();
        }
    }

    public void update(LocalDateTime resultDate, String resultSummary, String detailedReport,
                       String laboratoryName, Boolean validated) {
        if (resultDate != null) {
            this.resultDate = resultDate;
        }
        if (resultSummary != null && !resultSummary.isBlank()) {
            this.resultSummary = resultSummary;
        }
        if (detailedReport != null) {
            this.detailedReport = detailedReport;
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

    public UUID getMedicalExamId() {
        if (medicalExamId != null) {
            return medicalExamId;
        }
        return medicalExam != null ? medicalExam.getId() : null;
    }

    public void setMedicalExamId(UUID medicalExamId) {
        this.medicalExamId = medicalExamId;
    }

    public MedicalExam getMedicalExam() {
        if (medicalExam != null) {
            return medicalExam;
        }
        if (medicalExamId != null) {
            return new MedicalExam(medicalExamId);
        }
        return null;
    }

    public void setMedicalExam(MedicalExam medicalExam) {
        this.medicalExam = medicalExam;
        if (medicalExam != null) {
            this.medicalExamId = medicalExam.getId();
        }
    }

    public LocalDateTime getResultDate() {
        return resultDate;
    }

    public void setResultDate(LocalDateTime resultDate) {
        this.resultDate = resultDate;
    }

    public String getResultSummary() {
        return resultSummary;
    }

    public void setResultSummary(String resultSummary) {
        this.resultSummary = resultSummary;
    }

    public String getDetailedReport() {
        return detailedReport;
    }

    public void setDetailedReport(String detailedReport) {
        this.detailedReport = detailedReport;
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

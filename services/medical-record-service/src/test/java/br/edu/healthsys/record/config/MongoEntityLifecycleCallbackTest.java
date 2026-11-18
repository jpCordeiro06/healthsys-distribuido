package br.edu.healthsys.record.config;

import static org.assertj.core.api.Assertions.assertThat;

import br.edu.healthsys.record.domain.Diagnosis;
import br.edu.healthsys.record.domain.ExamResult;
import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.domain.ProcessedEvent;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MongoEntityLifecycleCallbackTest {

    private MongoEntityLifecycleCallback callback;

    @BeforeEach
    void setUp() {
        callback = new MongoEntityLifecycleCallback();
    }

    @Test
    @DisplayName("Should populate id and timestamps on MedicalRecord when null")
    void shouldPopulateMedicalRecordOnBeforeConvert() {
        MedicalRecord record = new MedicalRecord();
        record.setId(null);
        record.setCreatedAt(null);
        record.setUpdatedAt(null);

        Object result = callback.onBeforeConvert(record, "medical_records");

        assertThat(result).isSameAs(record);
        assertThat(record.getId()).isNotNull();
        assertThat(record.getCreatedAt()).isNotNull();
        assertThat(record.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should populate id and date on MedicalExam when null")
    void shouldPopulateMedicalExamOnBeforeConvert() {
        MedicalExam exam = new MedicalExam();
        exam.setId(null);
        exam.setDate(null);

        Object result = callback.onBeforeConvert(exam, "medical_exams");

        assertThat(result).isSameAs(exam);
        assertThat(exam.getId()).isNotNull();
        assertThat(exam.getDate()).isNotNull();
    }

    @Test
    @DisplayName("Should populate id and date on Diagnosis when null")
    void shouldPopulateDiagnosisOnBeforeConvert() {
        Diagnosis diagnosis = new Diagnosis();
        diagnosis.setId(null);
        diagnosis.setDate(null);

        Object result = callback.onBeforeConvert(diagnosis, "diagnoses");

        assertThat(result).isSameAs(diagnosis);
        assertThat(diagnosis.getId()).isNotNull();
        assertThat(diagnosis.getDate()).isNotNull();
    }

    @Test
    @DisplayName("Should populate id and resultDate on ExamResult when null")
    void shouldPopulateExamResultOnBeforeConvert() {
        ExamResult examResult = new ExamResult();
        examResult.setId(null);
        examResult.setResultDate(null);

        Object result = callback.onBeforeConvert(examResult, "exam_results");

        assertThat(result).isSameAs(examResult);
        assertThat(examResult.getId()).isNotNull();
        assertThat(examResult.getResultDate()).isNotNull();
    }

    @Test
    @DisplayName("Should populate processedAt on ProcessedEvent when null")
    void shouldPopulateProcessedEventOnBeforeConvert() {
        ProcessedEvent event = new ProcessedEvent(UUID.randomUUID(), "PATIENT_CREATED", null);

        Object result = callback.onBeforeConvert(event, "processed_events");

        assertThat(result).isSameAs(event);
        assertThat(event.getProcessedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should return unchanged entity for non-domain object")
    void shouldReturnUnchangedForOtherEntities() {
        String entity = "some-entity";
        Object result = callback.onBeforeConvert(entity, "some_collection");

        assertThat(result).isSameAs(entity);
    }
}

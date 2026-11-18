package br.edu.healthsys.record.config;

import br.edu.healthsys.record.domain.Diagnosis;
import br.edu.healthsys.record.domain.ExamResult;
import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.domain.ProcessedEvent;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.stereotype.Component;

@Component
public class MongoEntityLifecycleCallback implements BeforeConvertCallback<Object> {

    @Override
    public Object onBeforeConvert(Object entity, String collection) {
        if (entity instanceof MedicalRecord record) {
            record.prePersist();
        } else if (entity instanceof MedicalExam exam) {
            exam.prePersist();
        } else if (entity instanceof Diagnosis diagnosis) {
            diagnosis.prePersist();
        } else if (entity instanceof ExamResult result) {
            result.prePersist();
        } else if (entity instanceof ProcessedEvent event) {
            event.prePersist();
        }
        return entity;
    }
}

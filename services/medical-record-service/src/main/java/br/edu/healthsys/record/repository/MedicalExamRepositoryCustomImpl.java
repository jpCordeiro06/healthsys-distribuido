package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.MedicalExam;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class MedicalExamRepositoryCustomImpl implements MedicalExamRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public MedicalExamRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<MedicalExam> findByFilter(UUID medicalRecordId, UUID patientId, UUID doctorId, String type, Boolean hasResult) {
        Query query = new Query();
        if (medicalRecordId != null) {
            query.addCriteria(Criteria.where("medicalRecordId").is(medicalRecordId));
        }
        if (patientId != null) {
            query.addCriteria(Criteria.where("patientId").is(patientId));
        }
        if (doctorId != null) {
            query.addCriteria(Criteria.where("doctorId").is(doctorId));
        }
        if (type != null && !type.isBlank()) {
            query.addCriteria(Criteria.where("type").regex(Pattern.quote(type.trim()), "i"));
        }
        if (hasResult != null) {
            query.addCriteria(Criteria.where("hasResult").is(hasResult));
        }
        query.with(Sort.by(Sort.Direction.DESC, "date"));
        return mongoTemplate.find(query, MedicalExam.class);
    }
}

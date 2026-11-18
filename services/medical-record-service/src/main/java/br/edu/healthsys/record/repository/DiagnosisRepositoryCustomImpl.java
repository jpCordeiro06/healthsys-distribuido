package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.Diagnosis;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class DiagnosisRepositoryCustomImpl implements DiagnosisRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public DiagnosisRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<Diagnosis> findByFilter(UUID medicalRecordId, UUID patientId, UUID doctorId, Boolean validated) {
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
        if (validated != null) {
            query.addCriteria(Criteria.where("validated").is(validated));
        }
        query.with(Sort.by(Sort.Direction.DESC, "date"));
        return mongoTemplate.find(query, Diagnosis.class);
    }
}

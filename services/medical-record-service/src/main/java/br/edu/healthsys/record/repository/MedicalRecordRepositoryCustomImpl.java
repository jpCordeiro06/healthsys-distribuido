package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.MedicalRecord;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class MedicalRecordRepositoryCustomImpl implements MedicalRecordRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public MedicalRecordRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<MedicalRecord> findByFilter(UUID patientId) {
        Query query = new Query();
        if (patientId != null) {
            query.addCriteria(Criteria.where("patientId").is(patientId));
        }
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        return mongoTemplate.find(query, MedicalRecord.class);
    }
}

package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.ExamResult;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class ExamResultRepositoryCustomImpl implements ExamResultRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public ExamResultRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<ExamResult> findByFilter(UUID medicalExamId) {
        Query query = new Query();
        if (medicalExamId != null) {
            query.addCriteria(Criteria.where("medicalExamId").is(medicalExamId));
        }
        query.with(Sort.by(Sort.Direction.DESC, "resultDate"));
        return mongoTemplate.find(query, ExamResult.class);
    }
}

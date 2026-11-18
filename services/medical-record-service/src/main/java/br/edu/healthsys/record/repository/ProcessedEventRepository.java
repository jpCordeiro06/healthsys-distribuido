package br.edu.healthsys.record.repository;

import br.edu.healthsys.record.domain.ProcessedEvent;
import java.util.UUID;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedEventRepository extends MongoRepository<ProcessedEvent, UUID> {
}

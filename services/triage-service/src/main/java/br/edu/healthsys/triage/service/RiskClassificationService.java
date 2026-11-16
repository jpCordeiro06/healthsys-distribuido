package br.edu.healthsys.triage.service;

import br.edu.healthsys.triage.api.RiskClassificationRequest;
import br.edu.healthsys.triage.domain.RiskClassification;
import br.edu.healthsys.triage.repository.RiskClassificationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class RiskClassificationService {

    private final RiskClassificationRepository repository;

    public RiskClassificationService(RiskClassificationRepository repository) {
        this.repository = repository;
    }

    public List<RiskClassification> list(Boolean onlyActive) {
        if (Boolean.TRUE.equals(onlyActive)) {
            return repository.findByActiveTrue();
        }
        return repository.findAll();
    }

    public RiskClassification getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classificacao de risco nao encontrada."));
    }

    @Transactional
    public RiskClassification create(RiskClassificationRequest request) {
        RiskClassification entity = new RiskClassification(
                request.name(),
                request.description(),
                request.priorityLevel(),
                request.active()
        );
        return repository.save(entity);
    }

    @Transactional
    public RiskClassification update(UUID id, RiskClassificationRequest request) {
        RiskClassification entity = getById(id);
        entity.update(
                request.name(),
                request.description(),
                request.priorityLevel(),
                request.active()
        );
        return entity;
    }

    @Transactional
    public void delete(UUID id) {
        RiskClassification entity = getById(id);
        repository.delete(entity);
    }
}

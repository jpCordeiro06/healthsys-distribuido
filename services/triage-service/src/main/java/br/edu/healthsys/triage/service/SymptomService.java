package br.edu.healthsys.triage.service;

import br.edu.healthsys.triage.api.SymptomRequest;
import br.edu.healthsys.triage.domain.Symptom;
import br.edu.healthsys.triage.repository.SymptomRepository;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class SymptomService {

    private final SymptomRepository repository;

    public SymptomService(SymptomRepository repository) {
        this.repository = repository;
    }

    public List<Symptom> list(Boolean onlyActive) {
        if (Boolean.TRUE.equals(onlyActive)) {
            return repository.findByActiveTrue();
        }
        return repository.findAll();
    }

    public Symptom getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sintoma nao encontrado."));
    }

    public Set<Symptom> findByIds(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        List<Symptom> found = repository.findAllByIdIn(ids);
        if (found.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um ou mais sintomas informados nao foram encontrados.");
        }
        return Set.copyOf(found);
    }

    @Transactional
    public Symptom create(SymptomRequest request) {
        Symptom entity = new Symptom(
                request.name(),
                request.description(),
                request.active()
        );
        return repository.save(entity);
    }

    @Transactional
    public Symptom update(UUID id, SymptomRequest request) {
        Symptom entity = getById(id);
        entity.update(
                request.name(),
                request.description(),
                request.active()
        );
        return entity;
    }

    @Transactional
    public void delete(UUID id) {
        Symptom entity = getById(id);
        repository.delete(entity);
    }
}

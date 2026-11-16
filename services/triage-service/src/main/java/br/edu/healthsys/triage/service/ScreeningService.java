package br.edu.healthsys.triage.service;

import br.edu.healthsys.triage.api.ScreeningRequest;
import br.edu.healthsys.triage.domain.RiskClassification;
import br.edu.healthsys.triage.domain.Screening;
import br.edu.healthsys.triage.domain.ScreeningStatus;
import br.edu.healthsys.triage.domain.Symptom;
import br.edu.healthsys.triage.repository.ScreeningRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ScreeningService {

    private final ScreeningRepository screeningRepository;
    private final RiskClassificationService riskClassificationService;
    private final SymptomService symptomService;

    public ScreeningService(
            ScreeningRepository screeningRepository,
            RiskClassificationService riskClassificationService,
            SymptomService symptomService
    ) {
        this.screeningRepository = screeningRepository;
        this.riskClassificationService = riskClassificationService;
        this.symptomService = symptomService;
    }

    public List<Screening> list(UUID patientId, ScreeningStatus status) {
        if (patientId != null || status != null) {
            return screeningRepository.findByFilter(patientId, status);
        }
        return screeningRepository.findAll();
    }

    public Screening getById(UUID id) {
        return screeningRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Triagem nao encontrada."));
    }

    @Transactional
    public Screening create(ScreeningRequest request) {
        RiskClassification riskClassification = null;
        if (request.riskClassificationId() != null) {
            riskClassification = riskClassificationService.getById(request.riskClassificationId());
        }

        Set<Symptom> symptoms = symptomService.findByIds(request.symptomIds());

        Screening entity = new Screening(
                request.patientId(),
                request.doctorId(),
                riskClassification,
                request.status(),
                request.screeningDate(),
                request.notes(),
                symptoms
        );

        return screeningRepository.save(entity);
    }

    @Transactional
    public Screening update(UUID id, ScreeningRequest request) {
        Screening entity = getById(id);

        RiskClassification riskClassification = null;
        if (request.riskClassificationId() != null) {
            riskClassification = riskClassificationService.getById(request.riskClassificationId());
        }

        Set<Symptom> symptoms = null;
        if (request.symptomIds() != null) {
            symptoms = symptomService.findByIds(request.symptomIds());
        }

        entity.update(
                request.doctorId(),
                riskClassification,
                request.status(),
                request.notes(),
                symptoms
        );

        return entity;
    }

    @Transactional
    public Screening updateStatus(UUID id, ScreeningStatus status) {
        Screening entity = getById(id);
        entity.updateStatus(status);
        return entity;
    }

    @Transactional
    public void delete(UUID id) {
        Screening entity = getById(id);
        screeningRepository.delete(entity);
    }

    @Transactional
    public Screening addSymptom(UUID id, UUID symptomId) {
        Screening entity = getById(id);
        Symptom symptom = symptomService.getById(symptomId);
        entity.addSymptom(symptom);
        return entity;
    }

    @Transactional
    public Screening removeSymptom(UUID id, UUID symptomId) {
        Screening entity = getById(id);
        Symptom symptom = symptomService.getById(symptomId);
        entity.removeSymptom(symptom);
        return entity;
    }
}

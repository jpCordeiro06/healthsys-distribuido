package br.edu.healthsys.triage.service;

import br.edu.healthsys.triage.api.ScreeningRequest;
import br.edu.healthsys.triage.domain.RiskClassification;
import br.edu.healthsys.triage.domain.Screening;
import br.edu.healthsys.triage.domain.ScreeningStatus;
import br.edu.healthsys.triage.domain.Symptom;
import br.edu.healthsys.triage.event.TriageClassifiedPayload;
import br.edu.healthsys.triage.event.TriageEventProducer;
import br.edu.healthsys.triage.grpc.PatientGrpcClient;
import br.edu.healthsys.triage.repository.ScreeningRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
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
    private final PatientGrpcClient patientGrpcClient;
    private final TriageEventProducer triageEventProducer;

    public ScreeningService(
            ScreeningRepository screeningRepository,
            RiskClassificationService riskClassificationService,
            SymptomService symptomService,
            PatientGrpcClient patientGrpcClient,
            @Autowired(required = false) TriageEventProducer triageEventProducer
    ) {
        this.screeningRepository = screeningRepository;
        this.riskClassificationService = riskClassificationService;
        this.symptomService = symptomService;
        this.patientGrpcClient = patientGrpcClient;
        this.triageEventProducer = triageEventProducer;
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
        patientGrpcClient.validatePatientExists(request.patientId());

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

        Screening saved = screeningRepository.save(entity);
        publishTriageEvent(saved);
        return saved;
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

        publishTriageEvent(entity);
        return entity;
    }

    @Transactional
    public Screening updateStatus(UUID id, ScreeningStatus status) {
        Screening entity = getById(id);
        entity.updateStatus(status);
        publishTriageEvent(entity);
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

    private void publishTriageEvent(Screening screening) {
        if (triageEventProducer != null) {
            try {
                String riskLevel = screening.getRiskClassification() != null
                        ? screening.getRiskClassification().getName()
                        : "NAO_URGENTE";
                TriageClassifiedPayload payload = new TriageClassifiedPayload(
                        screening.getId(),
                        screening.getPatientId(),
                        riskLevel,
                        screening.getStatus() != null ? screening.getStatus().name() : "AGUARDANDO"
                );
                triageEventProducer.publishTriageClassified(payload, null);
            } catch (Exception e) {
                // Não falha a transação caso a publicação de evento assíncrono encontre problema
            }
        }
    }
}

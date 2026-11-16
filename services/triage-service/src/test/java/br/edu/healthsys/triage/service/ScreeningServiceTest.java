package br.edu.healthsys.triage.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.triage.api.ScreeningRequest;
import br.edu.healthsys.triage.domain.RiskClassification;
import br.edu.healthsys.triage.domain.Screening;
import br.edu.healthsys.triage.domain.ScreeningStatus;
import br.edu.healthsys.triage.domain.Symptom;
import br.edu.healthsys.triage.repository.ScreeningRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ScreeningServiceTest {

    @Mock
    private ScreeningRepository screeningRepository;

    @Mock
    private RiskClassificationService riskClassificationService;

    @Mock
    private SymptomService symptomService;

    private ScreeningService screeningService;

    @BeforeEach
    void setUp() {
        screeningService = new ScreeningService(screeningRepository, riskClassificationService, symptomService);
    }

    @Test
    void shouldCreateScreeningSuccessfully() {
        UUID patientId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();
        UUID symptomId = UUID.randomUUID();

        RiskClassification riskClassification = new RiskClassification("Alta", "Critico", 3, true);
        Symptom symptom = new Symptom("Dor de cabeca", "Intensa", true);

        when(riskClassificationService.getById(riskId)).thenReturn(riskClassification);
        when(symptomService.findByIds(Set.of(symptomId))).thenReturn(Set.of(symptom));
        when(screeningRepository.save(any(Screening.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ScreeningRequest request = new ScreeningRequest(
                patientId,
                null,
                riskId,
                ScreeningStatus.AGUARDANDO,
                LocalDateTime.now(),
                "Paciente com dor intensa",
                Set.of(symptomId)
        );

        Screening result = screeningService.create(request);

        assertNotNull(result);
        assertEquals(patientId, result.getPatientId());
        assertEquals(riskClassification, result.getRiskClassification());
        assertEquals(1, result.getSymptoms().size());
        verify(screeningRepository).save(any(Screening.class));
    }

    @Test
    void shouldThrowNotFoundWhenScreeningDoesNotExist() {
        UUID nonExistentId = UUID.randomUUID();
        when(screeningRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> screeningService.getById(nonExistentId));
    }
}

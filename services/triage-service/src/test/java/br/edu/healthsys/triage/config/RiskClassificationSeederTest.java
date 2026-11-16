package br.edu.healthsys.triage.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.triage.domain.RiskClassification;
import br.edu.healthsys.triage.repository.RiskClassificationRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RiskClassificationSeederTest {

    @Mock
    private RiskClassificationRepository riskClassificationRepository;

    private RiskClassificationSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new RiskClassificationSeeder(riskClassificationRepository);
    }

    @Test
    void shouldSeedAllWhenRepositoryIsEmpty() {
        when(riskClassificationRepository.findByNameIgnoreCase(any())).thenReturn(Optional.empty());

        seeder.run();

        verify(riskClassificationRepository, times(5)).save(any(RiskClassification.class));
    }

    @Test
    void shouldNotSeedWhenClassificationsAlreadyExist() {
        RiskClassification existing = new RiskClassification("Emergência (Vermelho)", "Desc", 1, true);
        when(riskClassificationRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(existing));

        seeder.run();

        verify(riskClassificationRepository, never()).save(any(RiskClassification.class));
    }
}

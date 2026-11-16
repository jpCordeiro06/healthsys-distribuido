package br.edu.healthsys.triage.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.triage.domain.Symptom;
import br.edu.healthsys.triage.repository.SymptomRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SymptomSeederTest {

    @Mock
    private SymptomRepository symptomRepository;

    private SymptomSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new SymptomSeeder(symptomRepository);
    }

    @Test
    void shouldSeedAllWhenRepositoryIsEmpty() {
        when(symptomRepository.findByNameIgnoreCase(any())).thenReturn(Optional.empty());

        seeder.run();

        verify(symptomRepository, times(12)).save(any(Symptom.class));
    }

    @Test
    void shouldNotSeedWhenSymptomsAlreadyExist() {
        Symptom existing = new Symptom("Febre alta (> 39°C)", "Desc", true);
        when(symptomRepository.findByNameIgnoreCase(any())).thenReturn(Optional.of(existing));

        seeder.run();

        verify(symptomRepository, never()).save(any(Symptom.class));
    }
}

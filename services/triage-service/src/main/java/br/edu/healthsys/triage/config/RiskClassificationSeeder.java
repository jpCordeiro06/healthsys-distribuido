package br.edu.healthsys.triage.config;

import br.edu.healthsys.triage.domain.RiskClassification;
import br.edu.healthsys.triage.repository.RiskClassificationRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class RiskClassificationSeeder implements CommandLineRunner {

    private final RiskClassificationRepository riskClassificationRepository;

    public RiskClassificationSeeder(RiskClassificationRepository riskClassificationRepository) {
        this.riskClassificationRepository = riskClassificationRepository;
    }

    @Override
    public void run(String... args) {
        List<RiskClassification> defaultClassifications = List.of(
            new RiskClassification(
                "Emergência (Vermelho)",
                "Atendimento imediato com risco iminente de morte",
                1,
                true
            ),
            new RiskClassification(
                "Muito Urgente (Laranja)",
                "Atendimento em até 10 minutos",
                2,
                true
            ),
            new RiskClassification(
                "Urgente (Amarelo)",
                "Atendimento em até 60 minutos",
                3,
                true
            ),
            new RiskClassification(
                "Pouco Urgente (Verde)",
                "Atendimento em até 120 minutos",
                4,
                true
            ),
            new RiskClassification(
                "Não Urgente (Azul)",
                "Atendimento em até 240 minutos",
                5,
                true
            )
        );

        for (RiskClassification classification : defaultClassifications) {
            if (riskClassificationRepository.findByNameIgnoreCase(classification.getName()).isEmpty()) {
                riskClassificationRepository.save(classification);
                System.out.println("Classificação de risco criada: " + classification.getName());
            }
        }
    }
}

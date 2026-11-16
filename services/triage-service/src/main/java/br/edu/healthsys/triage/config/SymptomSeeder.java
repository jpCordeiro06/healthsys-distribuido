package br.edu.healthsys.triage.config;

import br.edu.healthsys.triage.domain.Symptom;
import br.edu.healthsys.triage.repository.SymptomRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class SymptomSeeder implements CommandLineRunner {

    private final SymptomRepository symptomRepository;

    public SymptomSeeder(SymptomRepository symptomRepository) {
        this.symptomRepository = symptomRepository;
    }

    @Override
    public void run(String... args) {
        List<Symptom> defaultSymptoms = List.of(
            new Symptom("Febre alta (> 39°C)", "Temperatura corporal elevada", true),
            new Symptom("Dor no peito", "Dor torácica de forte intensidade", true),
            new Symptom("Falta de ar", "Dispneia ou esforço respiratório", true),
            new Symptom("Cefaleia intensa", "Dor de cabeça aguda ou persistente", true),
            new Symptom("Náuseas e vômitos", "Desconforto gástrico acompanhado de vômito", true),
            new Symptom("Dor abdominal aguda", "Dor na região do abdômen", true),
            new Symptom("Tontura e vertigem", "Sensação de perda de equilíbrio ou desmaio", true),
            new Symptom("Tosse persistente", "Tosse seca ou produtiva há mais de 3 dias", true),
            new Symptom("Hemorragia ativa", "Perda de sangue volumosa ou contínua", true),
            new Symptom("Convulsão", "Crise convulsiva ou tremores involuntários", true),
            new Symptom("Perda de consciência", "Desmaio ou síncope com perda de resposta", true),
            new Symptom("Queimadura grave", "Lesão tecidual térmica extensa", true)
        );

        for (Symptom symptom : defaultSymptoms) {
            if (symptomRepository.findByNameIgnoreCase(symptom.getName()).isEmpty()) {
                symptomRepository.save(symptom);
                System.out.println("Sintoma criado: " + symptom.getName());
            }
        }
    }
}

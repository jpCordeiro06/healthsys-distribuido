package br.edu.healthsys.triage.event;

import java.util.UUID;

public record TriageClassifiedPayload(
        UUID idTriagem,
        UUID idPaciente,
        String nivelRisco,
        String status
) {}

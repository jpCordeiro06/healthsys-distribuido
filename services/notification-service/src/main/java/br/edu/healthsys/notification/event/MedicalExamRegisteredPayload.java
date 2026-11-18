package br.edu.healthsys.notification.event;

import java.util.UUID;

public record MedicalExamRegisteredPayload(
        UUID idPaciente,
        String tipoExame,
        String profissionalSolicitante
) {}

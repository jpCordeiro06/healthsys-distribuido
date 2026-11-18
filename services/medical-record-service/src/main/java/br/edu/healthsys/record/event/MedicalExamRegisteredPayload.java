package br.edu.healthsys.record.event;

import java.util.UUID;

public record MedicalExamRegisteredPayload(
        UUID idPaciente,
        String tipoExame,
        String profissionalSolicitante
) {}

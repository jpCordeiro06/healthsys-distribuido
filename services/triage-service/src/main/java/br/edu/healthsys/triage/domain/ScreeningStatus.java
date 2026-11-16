package br.edu.healthsys.triage.domain;

public enum ScreeningStatus {
    AGUARDANDO,
    ATENDIDO,
    DESISTIU;

    public static ScreeningStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return AGUARDANDO;
        }
        return ScreeningStatus.valueOf(value.trim().toUpperCase());
    }
}

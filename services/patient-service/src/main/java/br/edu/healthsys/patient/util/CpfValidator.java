package br.edu.healthsys.patient.util;

public final class CpfValidator {
    private CpfValidator() {}

    public static String normalize(String cpf) {
        return cpf == null ? null : cpf.replaceAll("\\D", "");
    }

    public static boolean isValid(String value) {
        if (value == null) return false;
        String cpf = normalize(value);
        if (!cpf.matches("\\d{11}") || cpf.chars().distinct().count() == 1) return false;
        int first = calculateDigit(cpf, 9);
        int second = calculateDigit(cpf, 10);
        return cpf.charAt(9) - '0' == first && cpf.charAt(10) - '0' == second;
    }

    private static int calculateDigit(String cpf, int length) {
        int sum = 0;
        for (int i = 0; i < length; i++) sum += (cpf.charAt(i) - '0') * (length + 1 - i);
        int remainder = (sum * 10) % 11;
        return remainder == 10 ? 0 : remainder;
    }
}

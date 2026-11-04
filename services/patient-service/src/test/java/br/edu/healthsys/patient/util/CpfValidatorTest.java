package br.edu.healthsys.patient.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class CpfValidatorTest {
    @Test
    void acceptsValidCpfWithAndWithoutPunctuation() {
        assertTrue(CpfValidator.isValid("529.982.247-25"));
        assertTrue(CpfValidator.isValid("52998224725"));
    }

    @Test
    void rejectsInvalidAndRepeatedDigits() {
        assertFalse(CpfValidator.isValid("111.111.111-11"));
        assertFalse(CpfValidator.isValid("529.982.247-24"));
        assertFalse(CpfValidator.isValid("123"));
        assertFalse(CpfValidator.isValid(null));
    }

    @Test
    void normalizesCpf() {
        assertEquals("52998224725", CpfValidator.normalize("529.982.247-25"));
    }
}

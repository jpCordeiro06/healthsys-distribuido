package br.edu.healthsys.patient.validation;

import br.edu.healthsys.patient.util.CpfValidator;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CPFValidator implements ConstraintValidator<CPF, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return CpfValidator.isValid(value);
    }
}

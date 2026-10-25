package br.edu.healthsys.patient.api;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    public record ErrorResponse(String codigo, String mensagem, Map<String, List<String>> campos) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException exception) {
        Map<String, List<String>> fields = new LinkedHashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            fields.computeIfAbsent(error.getField(), ignored -> new java.util.ArrayList<>())
                    .add(error.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(
                new ErrorResponse("VALIDACAO", "Existem campos invalidos.", fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> malformedBody(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(new ErrorResponse(
                "REQUISICAO_INVALIDA", "O corpo da requisicao e invalido ou possui data em formato incorreto.", Map.of()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> status(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String code = status == HttpStatus.NOT_FOUND ? "NAO_ENCONTRADO" : "REQUISICAO_INVALIDA";
        String message = exception.getReason() == null ? "A requisicao nao pode ser processada." : exception.getReason();
        return ResponseEntity.status(status).body(new ErrorResponse(code, message, Map.of()));
    }
}

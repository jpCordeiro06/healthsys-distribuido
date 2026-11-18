package br.edu.healthsys.record.api;

import br.edu.healthsys.record.domain.ExamResult;
import br.edu.healthsys.record.service.ExamResultService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/exam-results")
public class ExamResultController {

    private final ExamResultService service;

    public ExamResultController(ExamResultService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public List<ExamResultResponse> list(@RequestParam(required = false) UUID medicalExamId) {
        return service.list(medicalExamId).stream()
                .map(ExamResultResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public ExamResultResponse getById(@PathVariable UUID id) {
        return ExamResultResponse.from(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<ExamResultResponse> create(@Valid @RequestBody ExamResultRequest request) {
        ExamResult created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(ExamResultResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ExamResultResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody ExamResultRequest request
    ) {
        return ExamResultResponse.from(service.update(id, request));
    }

    @PatchMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ExamResultResponse validate(
            @PathVariable UUID id,
            @Valid @RequestBody ValidationStatusUpdateRequest request
    ) {
        return ExamResultResponse.from(service.validate(id, request.validated()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

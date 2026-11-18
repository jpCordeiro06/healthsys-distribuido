package br.edu.healthsys.record.api;

import br.edu.healthsys.record.domain.Diagnosis;
import br.edu.healthsys.record.service.DiagnosisService;
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
@RequestMapping("/api/v1/diagnoses")
public class DiagnosisController {

    private final DiagnosisService service;

    public DiagnosisController(DiagnosisService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public List<DiagnosisResponse> list(
            @RequestParam(required = false) UUID medicalRecordId,
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) UUID doctorId,
            @RequestParam(required = false) Boolean validated
    ) {
        return service.list(medicalRecordId, patientId, doctorId, validated).stream()
                .map(DiagnosisResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public DiagnosisResponse getById(@PathVariable UUID id) {
        return DiagnosisResponse.from(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<DiagnosisResponse> create(@Valid @RequestBody DiagnosisRequest request) {
        Diagnosis created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(DiagnosisResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public DiagnosisResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody DiagnosisRequest request
    ) {
        return DiagnosisResponse.from(service.update(id, request));
    }

    @PatchMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public DiagnosisResponse validate(
            @PathVariable UUID id,
            @Valid @RequestBody ValidationStatusUpdateRequest request
    ) {
        return DiagnosisResponse.from(service.validate(id, request.validated()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

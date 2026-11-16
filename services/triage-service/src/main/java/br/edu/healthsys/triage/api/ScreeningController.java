package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.Screening;
import br.edu.healthsys.triage.domain.ScreeningStatus;
import br.edu.healthsys.triage.service.ScreeningService;
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
@RequestMapping("/api/v1/screenings")
public class ScreeningController {

    private final ScreeningService service;

    public ScreeningController(ScreeningService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public List<ScreeningResponse> list(
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) ScreeningStatus status
    ) {
        return service.list(patientId, status).stream()
                .map(ScreeningResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public ScreeningResponse getById(@PathVariable UUID id) {
        return ScreeningResponse.from(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ResponseEntity<ScreeningResponse> create(@Valid @RequestBody ScreeningRequest request) {
        Screening created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(ScreeningResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ScreeningResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody ScreeningRequest request
    ) {
        return ScreeningResponse.from(service.update(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ScreeningResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ScreeningStatusUpdateRequest request
    ) {
        return ScreeningResponse.from(service.updateStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/symptoms/{symptomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ScreeningResponse addSymptom(@PathVariable UUID id, @PathVariable UUID symptomId) {
        return ScreeningResponse.from(service.addSymptom(id, symptomId));
    }

    @DeleteMapping("/{id}/symptoms/{symptomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ScreeningResponse removeSymptom(@PathVariable UUID id, @PathVariable UUID symptomId) {
        return ScreeningResponse.from(service.removeSymptom(id, symptomId));
    }
}

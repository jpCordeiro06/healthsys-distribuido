package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.RiskClassification;
import br.edu.healthsys.triage.service.RiskClassificationService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/risk-classifications")
public class RiskClassificationController {

    private final RiskClassificationService service;

    public RiskClassificationController(RiskClassificationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public List<RiskClassificationResponse> list(
            @RequestParam(required = false, defaultValue = "false") Boolean onlyActive
    ) {
        return service.list(onlyActive).stream()
                .map(RiskClassificationResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public RiskClassificationResponse getById(@PathVariable UUID id) {
        return RiskClassificationResponse.from(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ResponseEntity<RiskClassificationResponse> create(@Valid @RequestBody RiskClassificationRequest request) {
        RiskClassification created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(RiskClassificationResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public RiskClassificationResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody RiskClassificationRequest request
    ) {
        return RiskClassificationResponse.from(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

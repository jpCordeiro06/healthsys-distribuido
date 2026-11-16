package br.edu.healthsys.triage.api;

import br.edu.healthsys.triage.domain.Symptom;
import br.edu.healthsys.triage.service.SymptomService;
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
@RequestMapping("/api/v1/symptoms")
public class SymptomController {

    private final SymptomService service;

    public SymptomController(SymptomService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public List<SymptomResponse> list(
            @RequestParam(required = false, defaultValue = "false") Boolean onlyActive
    ) {
        return service.list(onlyActive).stream()
                .map(SymptomResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public SymptomResponse getById(@PathVariable UUID id) {
        return SymptomResponse.from(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public ResponseEntity<SymptomResponse> create(@Valid @RequestBody SymptomRequest request) {
        Symptom created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(SymptomResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO')")
    public SymptomResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody SymptomRequest request
    ) {
        return SymptomResponse.from(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

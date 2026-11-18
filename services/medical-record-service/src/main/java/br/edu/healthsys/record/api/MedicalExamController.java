package br.edu.healthsys.record.api;

import br.edu.healthsys.record.domain.MedicalExam;
import br.edu.healthsys.record.service.MedicalExamService;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/medical-exams")
public class MedicalExamController {

    private final MedicalExamService service;

    public MedicalExamController(MedicalExamService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public List<MedicalExamResponse> list(
            @RequestParam(required = false) UUID medicalRecordId,
            @RequestParam(required = false) UUID patientId,
            @RequestParam(required = false) UUID doctorId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean hasResult
    ) {
        return service.list(medicalRecordId, patientId, doctorId, type, hasResult).stream()
                .map(MedicalExamResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public MedicalExamResponse getById(@PathVariable UUID id) {
        return MedicalExamResponse.from(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<MedicalExamResponse> create(
            @Valid @RequestBody MedicalExamRequest request,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId
    ) {
        MedicalExam created = service.create(request, correlationId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(MedicalExamResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public MedicalExamResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody MedicalExamRequest request
    ) {
        return MedicalExamResponse.from(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

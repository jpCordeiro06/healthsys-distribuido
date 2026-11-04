package br.edu.healthsys.patient.api;

import br.edu.healthsys.patient.service.PatientService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE_FIELDS = Set.of("nome", "cpf", "dataNascimento", "sexo");
    private final PatientService service;
    public PatientController(PatientService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<PatientResponse> create(@Valid @RequestBody PatientRequest request) {
        PatientResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/v1/patients/" + created.id())).body(created);
    }
    @GetMapping
    public PageResponse<PatientResponse> list(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String sort) {
        if (page < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O parametro page deve ser maior ou igual a zero.");
        if (size < 1 || size > MAX_PAGE_SIZE) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O parametro size deve estar entre 1 e 100.");
        return PageResponse.from(service.list(PageRequest.of(page, size, parseSort(sort))));
    }
    @GetMapping("/{patientId}") public PatientResponse get(@PathVariable UUID patientId) { return service.get(patientId); }
    @PutMapping("/{patientId}") public PatientResponse update(@PathVariable UUID patientId, @Valid @RequestBody PatientRequest request) { return service.update(patientId, request); }
    @DeleteMapping("/{patientId}") public ResponseEntity<Void> delete(@PathVariable UUID patientId) { service.delete(patientId); return ResponseEntity.noContent().build(); }

    @PostMapping("/{patientId}/allergies")
    public ResponseEntity<PatientAllergyResponse> addAllergy(@PathVariable UUID patientId, @Valid @RequestBody PatientAllergyRequest request) {
        PatientAllergyResponse created = service.addAllergy(patientId, request);
        return ResponseEntity.created(URI.create("/api/v1/patients/" + patientId + "/allergies/" + created.id())).body(created);
    }
    @GetMapping("/{patientId}/allergies") public java.util.List<PatientAllergyResponse> listAllergies(@PathVariable UUID patientId) { return service.listAllergies(patientId); }
    @PutMapping("/{patientId}/allergies/{allergyId}") public PatientAllergyResponse updateAllergy(@PathVariable UUID patientId, @PathVariable UUID allergyId, @Valid @RequestBody PatientAllergyRequest request) { return service.updateAllergy(patientId, allergyId, request); }
    @DeleteMapping("/{patientId}/allergies/{allergyId}") public ResponseEntity<Void> deleteAllergy(@PathVariable UUID patientId, @PathVariable UUID allergyId) { service.deleteAllergy(patientId, allergyId); return ResponseEntity.noContent().build(); }

    @PostMapping("/{patientId}/vaccines")
    public ResponseEntity<PatientVaccineResponse> addVaccine(@PathVariable UUID patientId, @Valid @RequestBody PatientVaccineRequest request) {
        PatientVaccineResponse created = service.addVaccine(patientId, request);
        return ResponseEntity.created(URI.create("/api/v1/patients/" + patientId + "/vaccines/" + created.id())).body(created);
    }
    @GetMapping("/{patientId}/vaccines") public java.util.List<PatientVaccineResponse> listVaccines(@PathVariable UUID patientId) { return service.listVaccines(patientId); }
    @PutMapping("/{patientId}/vaccines/{vaccineId}") public PatientVaccineResponse updateVaccine(@PathVariable UUID patientId, @PathVariable UUID vaccineId, @Valid @RequestBody PatientVaccineRequest request) { return service.updateVaccine(patientId, vaccineId, request); }
    @DeleteMapping("/{patientId}/vaccines/{vaccineId}") public ResponseEntity<Void> deleteVaccine(@PathVariable UUID patientId, @PathVariable UUID vaccineId) { service.deleteVaccine(patientId, vaccineId); return ResponseEntity.noContent().build(); }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) return Sort.by(Sort.Direction.ASC, "nome");
        String[] parts = sort.split(",", -1); String field = parts[0].trim();
        if (!SORTABLE_FIELDS.contains(field) || parts.length > 2) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo de ordenacao invalido.");
        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length == 2) try { direction = Sort.Direction.fromString(parts[1].trim()); }
        catch (IllegalArgumentException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Direcao deve ser asc ou desc."); }
        return Sort.by(direction, field);
    }
}

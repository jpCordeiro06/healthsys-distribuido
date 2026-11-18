package br.edu.healthsys.notification.api;

import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.service.NotificationChannelService;
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
@RequestMapping("/api/v1/notification-channels")
public class NotificationChannelController {

    private final NotificationChannelService service;

    public NotificationChannelController(NotificationChannelService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO', 'PACIENTE')")
    public List<NotificationChannelResponse> list(@RequestParam(required = false) Boolean active) {
        return service.list(active).stream()
                .map(NotificationChannelResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO', 'PACIENTE')")
    public NotificationChannelResponse getById(@PathVariable UUID id) {
        return NotificationChannelResponse.from(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationChannelResponse> create(@Valid @RequestBody NotificationChannelRequest request) {
        NotificationChannel created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(NotificationChannelResponse.from(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationChannelResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody NotificationChannelRequest request
    ) {
        return NotificationChannelResponse.from(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

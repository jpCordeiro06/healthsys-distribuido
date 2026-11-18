package br.edu.healthsys.notification.api;

import br.edu.healthsys.notification.domain.Notification;
import br.edu.healthsys.notification.domain.NotificationType;
import br.edu.healthsys.notification.service.NotificationService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO', 'PACIENTE')")
    public List<NotificationResponse> list(
            @RequestParam(required = false) UUID receiverId,
            @RequestParam(required = false) UUID senderId,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) Boolean isUrgent,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) UUID channelId
    ) {
        return service.list(receiverId, senderId, isRead, isUrgent, type, channelId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO', 'PACIENTE')")
    public NotificationResponse getById(@PathVariable UUID id) {
        return NotificationResponse.from(service.getById(id));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO', 'PACIENTE')")
    public NotificationCountResponse getUnreadCount(@RequestParam UUID receiverId) {
        return new NotificationCountResponse(service.getUnreadCount(receiverId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody NotificationRequest request) {
        Notification created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(NotificationResponse.from(created));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO', 'PACIENTE')")
    public NotificationResponse markAsRead(@PathVariable UUID id) {
        return NotificationResponse.from(service.markAsRead(id));
    }

    @PatchMapping("/{id}/unread")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO', 'PACIENTE')")
    public NotificationResponse markAsUnread(@PathVariable UUID id) {
        return NotificationResponse.from(service.markAsUnread(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

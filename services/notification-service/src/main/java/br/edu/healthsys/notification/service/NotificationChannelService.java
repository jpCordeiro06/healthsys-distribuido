package br.edu.healthsys.notification.service;

import br.edu.healthsys.notification.api.NotificationChannelRequest;
import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class NotificationChannelService {

    private final NotificationChannelRepository repository;

    public NotificationChannelService(NotificationChannelRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NotificationChannel> list(Boolean active) {
        if (Boolean.TRUE.equals(active)) {
            return repository.findByActiveTrue();
        }
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public NotificationChannel getById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Canal de notificacao nao encontrado."));
    }

    public NotificationChannel create(NotificationChannelRequest request) {
        Optional<NotificationChannel> existing = repository.findByNameIgnoreCase(request.name().trim());
        if (existing.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe um canal de notificacao com este nome.");
        }

        NotificationChannel channel = new NotificationChannel(
                request.name().trim(),
                request.description(),
                request.active()
        );
        return repository.save(channel);
    }

    public NotificationChannel update(UUID id, NotificationChannelRequest request) {
        NotificationChannel channel = getById(id);

        Optional<NotificationChannel> existing = repository.findByNameIgnoreCase(request.name().trim());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe outro canal de notificacao com este nome.");
        }

        channel.update(request.name().trim(), request.description(), request.active());
        return repository.save(channel);
    }

    public void delete(UUID id) {
        NotificationChannel channel = getById(id);
        repository.delete(channel);
    }
}

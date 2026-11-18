package br.edu.healthsys.notification.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.notification.api.NotificationChannelRequest;
import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class NotificationChannelServiceTest {

    @Mock
    private NotificationChannelRepository repository;

    private NotificationChannelService service;

    @BeforeEach
    void setUp() {
        service = new NotificationChannelService(repository);
    }

    @Test
    void shouldCreateChannelSuccessfully() {
        when(repository.findByNameIgnoreCase("Email")).thenReturn(Optional.empty());
        when(repository.save(any(NotificationChannel.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationChannelRequest request = new NotificationChannelRequest("Email", "Descricao", true);
        NotificationChannel result = service.create(request);

        assertNotNull(result);
        assertEquals("Email", result.getName());
        assertEquals("Descricao", result.getDescription());
        verify(repository).save(any(NotificationChannel.class));
    }

    @Test
    void shouldThrowConflictWhenCreatingDuplicateChannel() {
        NotificationChannel existing = new NotificationChannel("Email", "Descricao", true);
        when(repository.findByNameIgnoreCase("Email")).thenReturn(Optional.of(existing));

        NotificationChannelRequest request = new NotificationChannelRequest("Email", "Descricao", true);

        assertThrows(ResponseStatusException.class, () -> service.create(request));
    }

    @Test
    void shouldListActiveChannelsOnly() {
        NotificationChannel channel = new NotificationChannel("Email", "Descricao", true);
        when(repository.findByActiveTrue()).thenReturn(List.of(channel));

        List<NotificationChannel> result = service.list(true);

        assertEquals(1, result.size());
        verify(repository).findByActiveTrue();
    }

    @Test
    void shouldDeleteChannel() {
        UUID id = UUID.randomUUID();
        NotificationChannel channel = new NotificationChannel(id, "Email", "Descricao", true);
        when(repository.findById(id)).thenReturn(Optional.of(channel));

        service.delete(id);

        verify(repository).delete(channel);
    }
}

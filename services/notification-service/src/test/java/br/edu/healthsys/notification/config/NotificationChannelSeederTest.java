package br.edu.healthsys.notification.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationChannelSeederTest {

    @Mock
    private NotificationChannelRepository repository;

    private NotificationChannelSeeder seeder;

    @BeforeEach
    void setUp() {
        seeder = new NotificationChannelSeeder(repository);
    }

    @Test
    void shouldSeedDefaultChannelsWhenRepositoryIsEmpty() {
        when(repository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());

        seeder.run();

        verify(repository, times(5)).save(any(NotificationChannel.class));
    }

    @Test
    void shouldNotSeedWhenChannelsAlreadyExist() {
        NotificationChannel existing = new NotificationChannel("Email", "Descricao", true);
        when(repository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(existing));

        seeder.run();

        verify(repository, never()).save(any(NotificationChannel.class));
    }
}

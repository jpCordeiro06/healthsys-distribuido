package br.edu.healthsys.notification.config;

import br.edu.healthsys.notification.domain.NotificationChannel;
import br.edu.healthsys.notification.repository.NotificationChannelRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class NotificationChannelSeeder implements CommandLineRunner {

    private final NotificationChannelRepository repository;

    public NotificationChannelSeeder(NotificationChannelRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        List<NotificationChannel> defaultChannels = List.of(
                new NotificationChannel("Email", "Envio de notificacoes por e-mail", true),
                new NotificationChannel("SMS", "Envio de mensagens curtas de texto", true),
                new NotificationChannel("WebSocket", "Notificacoes em tempo real no navegador", true),
                new NotificationChannel("Push", "Notificacoes push em dispositivos moveis", true),
                new NotificationChannel("WhatsApp", "Mensagens instantaneas via WhatsApp", true)
        );

        for (NotificationChannel channel : defaultChannels) {
            if (repository.findByNameIgnoreCase(channel.getName()).isEmpty()) {
                repository.save(channel);
            }
        }
    }
}

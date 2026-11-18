package br.edu.healthsys.notification.websocket;

import br.edu.healthsys.notification.api.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class RealtimeNotificationPublisher {

    private static final Logger log = LoggerFactory.getLogger(RealtimeNotificationPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeNotificationPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishRiskAlert(NotificationResponse notification) {
        log.info("Publicando alerta de risco no topico /topic/alertas/risco: {}", notification.title());
        messagingTemplate.convertAndSend("/topic/alertas/risco", notification);
    }

    public void publishToUser(UUID userId, NotificationResponse notification) {
        log.info("Publicando notificacao para usuario {} na fila /user/{}/queue/notificacoes", userId, userId);
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notificacoes", notification);
        // Também enviar direto para destino de fallback caso o cliente assine /queue/notificacoes
        messagingTemplate.convertAndSend("/queue/notificacoes/" + userId, notification);
    }
}

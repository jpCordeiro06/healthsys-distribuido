package br.edu.healthsys.notification.api;

import br.edu.healthsys.notification.domain.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record NotificationRequest(
        UUID senderId,

        @NotNull(message = "O ID do destinatario e obrigatorio.")
        UUID receiverId,

        NotificationType type,

        @NotBlank(message = "O titulo da mensagem e obrigatorio.")
        @Size(max = 255, message = "O titulo deve ter no maximo 255 caracteres.")
        String title,

        @NotBlank(message = "O conteudo da mensagem e obrigatorio.")
        String message,

        Boolean isUrgent,

        UUID notificationChannelId
) {}

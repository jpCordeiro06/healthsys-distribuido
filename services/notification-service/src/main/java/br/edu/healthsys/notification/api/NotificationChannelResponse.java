package br.edu.healthsys.notification.api;

import br.edu.healthsys.notification.domain.NotificationChannel;
import java.util.UUID;

public record NotificationChannelResponse(
        UUID id,
        String name,
        String description,
        boolean active
) {
    public static NotificationChannelResponse from(NotificationChannel channel) {
        if (channel == null) {
            return null;
        }
        return new NotificationChannelResponse(
                channel.getId(),
                channel.getName(),
                channel.getDescription(),
                channel.isActive()
        );
    }
}

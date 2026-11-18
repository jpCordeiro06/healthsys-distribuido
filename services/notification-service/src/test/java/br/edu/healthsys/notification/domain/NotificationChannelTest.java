package br.edu.healthsys.notification.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class NotificationChannelTest {

    @Test
    void shouldCreateAndUpdateChannel() {
        NotificationChannel channel = new NotificationChannel("Email", "Canal de email", true);

        assertEquals("Email", channel.getName());
        assertEquals("Canal de email", channel.getDescription());
        assertTrue(channel.isActive());

        channel.update("SMS", "Mensagem de texto", false);

        assertEquals("SMS", channel.getName());
        assertEquals("Mensagem de texto", channel.getDescription());
        assertFalse(channel.isActive());
    }
}

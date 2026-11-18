package br.edu.healthsys.notification.repository;

import br.edu.healthsys.notification.domain.NotificationChannel;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationChannelRepository extends JpaRepository<NotificationChannel, UUID> {

    Optional<NotificationChannel> findByNameIgnoreCase(String name);

    List<NotificationChannel> findByActiveTrue();
}

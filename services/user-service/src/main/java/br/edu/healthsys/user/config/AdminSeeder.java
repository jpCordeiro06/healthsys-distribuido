package br.edu.healthsys.user.config;

import br.edu.healthsys.user.domain.Role;
import br.edu.healthsys.user.domain.User;
import br.edu.healthsys.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin@healthsys.com";

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setNome("Administrador do Sistema");
            admin.setEmail(adminEmail);
            admin.setSenha(passwordEncoder.encode("Admin@123")); // Senha criptografada com BCrypt
            admin.setPerfil(Role.ADMIN);

            userRepository.save(admin);
            System.out.println("Usuário ADMIN criado com sucesso: " + adminEmail);
        }
    }
}

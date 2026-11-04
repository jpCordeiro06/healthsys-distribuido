package br.edu.healthsys.user.service;

import br.edu.healthsys.user.domain.User;
import br.edu.healthsys.user.dto.UserUpdateRequest;
import org.springframework.transaction.annotation.Transactional;
import br.edu.healthsys.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.UUID;

@Service
public class UserService {
    private static final Set<String> SORT_FIELDS = Set.of("id", "nome", "email", "perfil");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("O e-mail fornecido já está em uso.");
        }
        user.setSenha(passwordEncoder.encode(user.getSenha()));
        return userRepository.save(user);
    }

    public Page<User> findAll(Pageable pageable) {
        for (var order : pageable.getSort()) {
            if (!SORT_FIELDS.contains(order.getProperty())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Campo de ordenação inválido. Use id, nome, email ou perfil.");
            }
        }
        return userRepository.findAll(pageable);
    }

    public User findById(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Utilizador não encontrado."));
    }

    public void delete(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("Utilizador não encontrado.");
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public User update(UUID id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        if (userRepository.existsByEmailAndIdNot(request.email(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O e-mail fornecido já está em uso.");
        }
        user.setNome(request.nome());
        user.setEmail(request.email());
        user.setPerfil(request.perfil());
        if (request.senha() != null) {
            user.setSenha(passwordEncoder.encode(request.senha()));
        }
        return userRepository.save(user);
    }
}

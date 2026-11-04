package br.edu.healthsys.user.dto;

import br.edu.healthsys.user.domain.Role;
import br.edu.healthsys.user.domain.User;
import java.util.UUID;

public record UserResponse(UUID id, String nome, String email, Role perfil) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getNome(), user.getEmail(), user.getPerfil());
    }
}

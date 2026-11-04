package br.edu.healthsys.user.dto;

import br.edu.healthsys.user.domain.Role;
import br.edu.healthsys.user.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
    @NotBlank @Size(max = 120) String nome,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(min = 8, max = 128) String senha,
    @NotNull Role perfil
) {
    public User toUser() {
        User user = new User();
        user.setNome(nome);
        user.setEmail(email);
        user.setSenha(senha);
        user.setPerfil(perfil);
        return user;
    }
}

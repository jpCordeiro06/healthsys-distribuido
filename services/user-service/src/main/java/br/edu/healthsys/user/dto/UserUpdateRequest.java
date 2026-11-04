package br.edu.healthsys.user.dto;

import br.edu.healthsys.user.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
    @NotBlank @Size(max = 120) String nome,
    @NotBlank @Email @Size(max = 254) String email,
    @Size(min = 8, max = 128) String senha,
    @NotNull Role perfil
) {}

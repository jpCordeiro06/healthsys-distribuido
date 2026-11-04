package br.edu.healthsys.user.dto;

public record LoginResponse(String accessToken, String tokenType, long expiresIn, UserResponse usuario) {
}

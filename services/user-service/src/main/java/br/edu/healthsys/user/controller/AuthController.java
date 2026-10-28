package br.edu.healthsys.user.controller;

import br.edu.healthsys.user.domain.User;
import br.edu.healthsys.user.dto.LoginRequest;
import br.edu.healthsys.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.*;

import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final RSAPublicKey publicKey;

    public AuthController(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtEncoder jwtEncoder,
        @Value("${rsa.public-key}") RSAPublicKey publicKey) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.publicKey = publicKey;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas."));

        if (!passwordEncoder.matches(request.getSenha(), user.getSenha())) {
            throw new IllegalArgumentException("Credenciais inválidas.");
        }

        Instant now = Instant.now();
        long expiresIn = 3600L; //1h

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("healthsys-user-service")
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expiresIn))
            .subject(user.getId().toString())
            .claim("perfil", user.getPerfil().name())
            .build();

        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();

        return ResponseEntity.ok(Map.of(
            "accessToken", token,
            "tokenType", "Bearer",
            "expiresIn", expiresIn
        ));
    }

    @GetMapping("/public-key")
    public ResponseEntity<String> getPublicKey() {
        String base64PublicKey = Base64.getEncoder().encodeToString(publicKey.getEncoded());
        return ResponseEntity.ok(base64PublicKey);
    }
}

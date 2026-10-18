package br.edu.healthsys.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

class HealthSysSecurityAutoConfigurationTest {

    private RSAKey signingKey;
    private HealthSysSecurityProperties properties;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        signingKey = new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                .privateKey((RSAPrivateKey) keyPair.getPrivate())
                .keyID("test-key")
                .build();

        properties = new HealthSysSecurityProperties();
        properties.getJwt().setPublicKey("-----BEGIN PUBLIC KEY-----\n"
                + Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(keyPair.getPublic().getEncoded())
                + "\n-----END PUBLIC KEY-----");
    }

    @Test
        void acceptsEverySupportedProfileAndMapsItToASpringRole() {
        HealthSysSecurityAutoConfiguration configuration = new HealthSysSecurityAutoConfiguration();
                for (String profile : new String[] {"ADMIN", "MEDICO", "ENFERMEIRO", "RECEPCAO"}) {
                        Jwt jwt = configuration.healthSysJwtDecoder(properties).decode(token(profile));
                        assertThat(configuration.healthSysJwtAuthenticationConverter().convert(jwt).getAuthorities())
                                        .containsExactly(new SimpleGrantedAuthority("ROLE_" + profile));
                }
    }

    @Test
    void rejectsUnsupportedProfiles() {
        HealthSysSecurityAutoConfiguration configuration = new HealthSysSecurityAutoConfiguration();

        assertThatThrownBy(() -> configuration.healthSysJwtDecoder(properties).decode(token("PACIENTE")))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void requiresThePublicKey() {
        HealthSysSecurityProperties missingKey = new HealthSysSecurityProperties();

        assertThatThrownBy(() -> new HealthSysSecurityAutoConfiguration().healthSysJwtDecoder(missingKey))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("HEALTHSYS_SECURITY_JWT_PUBLIC_KEY");
    }

    private String token(String profile) {
                JWKSource<SecurityContext> jwkSource = (selector, context) -> selector.select(new JWKSet(signingKey));
                NimbusJwtEncoder encoder = new NimbusJwtEncoder(jwkSource);
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject("user-123")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(300))
                .claim("perfil", profile)
                .build();
        return encoder.encode(JwtEncoderParameters.from(
                org.springframework.security.oauth2.jwt.JwsHeader.with(SignatureAlgorithm.RS256)
                        .keyId("test-key")
                        .build(),
                claims)).getTokenValue();
    }
}
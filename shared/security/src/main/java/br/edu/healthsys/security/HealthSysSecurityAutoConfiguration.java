package br.edu.healthsys.security;

import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.AuthenticationEntryPoint;

@AutoConfiguration
@EnableConfigurationProperties(HealthSysSecurityProperties.class)
@EnableMethodSecurity
public class HealthSysSecurityAutoConfiguration {

    private static final Set<String> PROFILES = Set.of("ADMIN", "MEDICO", "ENFERMEIRO", "RECEPCAO");

    /** Cria o decodificador que valida a assinatura, a validade temporal e o perfil permitido do JWT. */
    @Bean
    @ConditionalOnMissingBean
    JwtDecoder healthSysJwtDecoder(HealthSysSecurityProperties properties) {
        RSAPublicKey publicKey = readPublicKey(properties.getJwt().getPublicKey());
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(publicKey).build();
        OAuth2TokenValidator<Jwt> profileValidator = jwt -> {
            String profile = jwt.getClaimAsString("perfil");
            if (profile != null && PROFILES.contains(profile)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(new OAuth2Error(
                    "invalid_token",
                    "JWT must contain a supported perfil claim.",
                    null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(), profileValidator));
        return decoder;
    }

    /** Converte o claim `perfil` do JWT em uma autoridade Spring no formato `ROLE_<PERFIL>`. */
    @Bean
    @ConditionalOnMissingBean
    JwtAuthenticationConverter healthSysJwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String profile = jwt.getClaimAsString("perfil");
            return List.of(new SimpleGrantedAuthority("ROLE_" + profile));
        });
        return converter;
    }

    /** Configura as regras HTTP sem sessão, os caminhos públicos e o suporte a JWT. */
    @Bean
    @ConditionalOnMissingBean
    SecurityFilterChain healthSysSecurityFilterChain(
            HttpSecurity http,
            HealthSysSecurityProperties properties,
            JwtDecoder decoder,
            JwtAuthenticationConverter authenticationConverter,
            ObjectMapper objectMapper) throws Exception {
        AuthenticationEntryPoint authenticationEntryPoint = (request, response, exception) ->
                writeError(objectMapper, response, HttpStatus.UNAUTHORIZED,
                        "NAO_AUTENTICADO", "Autenticacao necessaria ou token invalido.");
        AccessDeniedHandler accessDeniedHandler = (request, response, exception) ->
                writeError(objectMapper, response, HttpStatus.FORBIDDEN,
                        "ACESSO_NEGADO", "Voce nao tem permissao para esta operacao.");

        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> {
                    authorize.requestMatchers("/actuator/health", "/actuator/health/**").permitAll();
                    properties.getPublicPaths().forEach(path -> authorize.requestMatchers(path).permitAll());
                    authorize.anyRequest().authenticated();
                })
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt.decoder(decoder).jwtAuthenticationConverter(authenticationConverter)));
        return http.build();
    }

    /** Escreve uma resposta JSON de erro no formato compartilhado pela API. */
    private static void writeError(
            ObjectMapper objectMapper,
            jakarta.servlet.http.HttpServletResponse response,
            HttpStatus status,
            String code,
            String message) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of(
                "codigo", code,
                "mensagem", message,
                "campos", Map.of()));
    }

    /** Converte uma chave pública RSA em PEM ou Base64 DER para o formato usado pelo decoder. */
    private static RSAPublicKey readPublicKey(String configuredKey) {
        if (configuredKey == null || configuredKey.isBlank()) {
            throw new IllegalStateException(
                    "Configure HEALTHSYS_SECURITY_JWT_PUBLIC_KEY with the JWT public key.");
        }
        try {
            String base64 = configuredKey
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] encodedKey = Base64.getDecoder().decode(base64);
            return (RSAPublicKey) KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(encodedKey));
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "HEALTHSYS_SECURITY_JWT_PUBLIC_KEY must be a valid RSA public key in PEM or Base64 DER format.",
                    exception);
        }
    }
}
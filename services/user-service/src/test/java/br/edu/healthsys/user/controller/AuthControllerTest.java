package br.edu.healthsys.user.controller;

import br.edu.healthsys.user.config.AdminSeeder;
import br.edu.healthsys.user.config.SecurityConfig;
import br.edu.healthsys.user.domain.User;
import br.edu.healthsys.user.repository.UserRepository;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, AuthControllerTest.Keys.class})
class AuthControllerTest {
    @Autowired MockMvc mvc;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtDecoder decoder;
    @Autowired ObjectMapper mapper;
    @MockitoBean UserRepository repository;

    @Test
    void seededAdminCanLogInWithoutTokenAtTheGatewayPath() throws Exception {
        new AdminSeeder(repository, passwordEncoder).run();
        var saved = ArgumentCaptor.forClass(User.class);
        verify(repository).save(saved.capture());
        User admin = saved.getValue();
        admin.setId(UUID.randomUUID());
        when(repository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));

        var result = mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@healthsys.com\",\"senha\":\"Admin@123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("tokenType").value("Bearer"))
            .andExpect(jsonPath("expiresIn").value(3600))
            .andExpect(jsonPath("usuario.id").value(admin.getId().toString()))
            .andExpect(jsonPath("usuario.nome").value("Administrador do Sistema"))
            .andExpect(jsonPath("usuario.email").value("admin@healthsys.com"))
            .andExpect(jsonPath("usuario.perfil").value("ADMIN"))
            .andExpect(jsonPath("usuario.*").value(org.hamcrest.Matchers.hasSize(4)))
            .andExpect(jsonPath("usuario.senha").doesNotExist())
            .andExpect(jsonPath("usuario.password").doesNotExist())
            .andReturn();
        String token = mapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
        assertThat(decoder.decode(token).getSubject()).isEqualTo(admin.getId().toString());
    }

    @Test
    void publicKeyIsPublicAndOtherRoutesRequireAuthentication() throws Exception {
        mvc.perform(get("/api/v1/auth/public-key")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/users")).andExpect(status().isUnauthorized());
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class Keys {
        @Bean
        KeyPair keyPair() throws Exception {
            var generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        }

        @Bean
        RSAPrivateKey privateKey(KeyPair pair) {
            return (RSAPrivateKey) pair.getPrivate();
        }

        @Bean
        RSAPublicKey publicKey(KeyPair pair) {
            return (RSAPublicKey) pair.getPublic();
        }
    }
}

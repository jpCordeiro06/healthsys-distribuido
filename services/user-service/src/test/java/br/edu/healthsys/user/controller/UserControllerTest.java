package br.edu.healthsys.user.controller;

import br.edu.healthsys.user.domain.User;
import br.edu.healthsys.user.repository.UserRepository;
import br.edu.healthsys.user.service.UserService;
import java.util.UUID;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import java.util.List;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerTest {
    private UserRepository repository;
    private BCryptPasswordEncoder encoder;
    private MockMvc mvc;

    @Test
    void updatesUserWithoutChangingPasswordWhenOmitted() throws Exception {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        user.setSenha(encoder.encode("SenhaAnterior123"));
        String oldHash = user.getSenha();
        when(repository.findById(id)).thenReturn(Optional.of(user));
        when(repository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        mvc.perform(put("/api/v1/users/{id}", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Nome novo\",\"email\":\"novo@example.com\",\"perfil\":\"MEDICO\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("nome").value("Nome novo"))
            .andExpect(jsonPath("email").value("novo@example.com"))
            .andExpect(jsonPath("perfil").value("MEDICO"))
            .andExpect(jsonPath("password").doesNotExist())
            .andExpect(jsonPath("senha").doesNotExist());
        assertThat(user.getSenha()).isEqualTo(oldHash);
    }

    @Test
    void hashesNewPasswordWhenUpdatingUser() throws Exception {
        UUID id = UUID.randomUUID();
        User user = new User();
        user.setId(id);
        when(repository.findById(id)).thenReturn(Optional.of(user));
        when(repository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        mvc.perform(put("/api/v1/users/{id}", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Jorge\",\"email\":\"novo@example.com\",\"perfil\":\"MEDICO\",\"senha\":\"NovaSenha123\"}"))
            .andExpect(status().isOk());
        assertThat(encoder.matches("NovaSenha123", user.getSenha())).isTrue();
    }

    @Test
    void rejectsDuplicateEmailWithoutSavingAndReturns404ForUnknownUser() throws Exception {
        UUID id = UUID.randomUUID();
        String body = "{\"nome\":\"Jorge\",\"email\":\"outro@example.com\",\"perfil\":\"MEDICO\"}";
        mvc.perform(put("/api/v1/users/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNotFound());
        when(repository.findById(id)).thenReturn(Optional.of(new User()));
        when(repository.existsByEmailAndIdNot("outro@example.com", id)).thenReturn(true);
        mvc.perform(put("/api/v1/users/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
        verify(repository, never()).save(any(User.class));
    }

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        encoder = new BCryptPasswordEncoder();
        mvc = MockMvcBuilders.standaloneSetup(
            new UserController(new UserService(repository, encoder)))
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver()).build();
    }

    @Test
    void forwardsPaginationAndSortToRepositoryAndReturnsSpringPage() throws Exception {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setNome("Jorge");
        user.setEmail("jorge@healthsys.com");
        user.setPerfil(br.edu.healthsys.user.domain.Role.MEDICO);
        user.setSenha("hash-must-not-be-returned");
        when(repository.findAll(any(Pageable.class))).thenAnswer(invocation -> {
            Pageable pageable = invocation.getArgument(0);
            assertThat(pageable.getPageNumber()).isEqualTo(1);
            assertThat(pageable.getPageSize()).isEqualTo(2);
            assertThat(pageable.getSort()).isEqualTo(Sort.by(Sort.Direction.DESC, "nome"));
            return new PageImpl<>(List.of(user), pageable, 3);
        });

        mvc.perform(get("/api/v1/users").param("page", "1").param("size", "2")
                .param("sort", "nome,desc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("content[0].nome").value("Jorge"))
            .andExpect(jsonPath("content[0].senha").doesNotExist())
            .andExpect(jsonPath("content[0].password").doesNotExist())
            .andExpect(jsonPath("number").value(1))
            .andExpect(jsonPath("size").value(2))
            .andExpect(jsonPath("totalElements").value(3))
            .andExpect(jsonPath("totalPages").value(2))
            .andExpect(jsonPath("first").value(false))
            .andExpect(jsonPath("last").value(true));
        verify(repository).findAll(any(Pageable.class));
    }

    @Test
    void acceptsPasswordFromJsonAndPersistsOnlyItsHash() throws Exception {
        when(repository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            assertThat(user.getSenha()).isNotEqualTo("abc@1234");
            assertThat(encoder.matches("abc@1234", user.getSenha())).isTrue();
            user.setId(UUID.randomUUID());
            return user;
        });

        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Jorge\",\"email\":\"jorge@healthsys.com\","
                    + "\"senha\":\"abc@1234\",\"perfil\":\"MEDICO\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("id").isNotEmpty())
            .andExpect(jsonPath("nome").value("Jorge"))
            .andExpect(jsonPath("email").value("jorge@healthsys.com"))
            .andExpect(jsonPath("perfil").value("MEDICO"))
            .andExpect(jsonPath("senha").doesNotExist())
            .andExpect(jsonPath("password").doesNotExist());
        verify(repository).save(any(User.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"<string>", "inexistente", "senha", "password", "nome.inexistente"})
    void rejectsInvalidSortFieldsBeforeQueryingRepository(String field) throws Exception {
        mvc.perform(get("/api/v1/users").param("sort", field + ",asc"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(repository);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", ",\"senha\":null", ",\"senha\":\"\"", ",\"senha\":\"curta\""})
    void rejectsMissingOrInvalidPasswordBeforeCallingTheService(String passwordField) throws Exception {
        mvc.perform(post("/api/v1/users").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Jorge\",\"email\":\"jorge@healthsys.com\","
                    + "\"perfil\":\"MEDICO\"" + passwordField + "}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(repository);
    }
}

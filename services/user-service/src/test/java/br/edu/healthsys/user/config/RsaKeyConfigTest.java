package br.edu.healthsys.user.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import static org.assertj.core.api.Assertions.assertThat;

class RsaKeyConfigTest {

    @TempDir
    Path directory;

    @Test
    void loadsPemResourcesAndUsesTheKeysToSignAndValidateTokens() throws Exception {
        var generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        var pair = generator.generateKeyPair();
        Path privateFile = writePem("private.pem", "PRIVATE KEY", pair.getPrivate().getEncoded());
        Path publicFile = writePem("public.pem", "PUBLIC KEY", pair.getPublic().getEncoded());

        new ApplicationContextRunner()
            .withUserConfiguration(RsaKeyConfig.class)
            .withPropertyValues("rsa.private-key=" + privateFile.toUri(),
                "rsa.public-key=" + publicFile.toUri())
            .run(context -> {
                assertThat(context).hasNotFailed();
                var privateKey = context.getBean(RSAPrivateKey.class);
                var publicKey = context.getBean(RSAPublicKey.class);
                assertThat(privateKey.getEncoded()).isEqualTo(pair.getPrivate().getEncoded());
                assertThat(publicKey.getEncoded()).isEqualTo(pair.getPublic().getEncoded());

                var security = new SecurityConfig(privateKey, publicKey);
                var claims = JwtClaimsSet.builder().subject("test-user")
                    .issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60)).build();
                var token = security.jwtEncoder().encode(JwtEncoderParameters.from(claims));
                assertThat(security.jwtDecoder().decode(token.getTokenValue()).getSubject())
                    .isEqualTo("test-user");
            });
    }

    private Path writePem(String filename, String label, byte[] encoded) throws Exception {
        return Files.writeString(directory.resolve(filename), "-----BEGIN " + label + "-----\n"
            + Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(encoded)
            + "\n-----END " + label + "-----\n");
    }
}

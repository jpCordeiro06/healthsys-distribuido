package br.edu.healthsys.user.config;

import java.io.IOException;
import java.io.InputStream;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.converter.RsaKeyConverters;

@Configuration(proxyBeanMethods = false)
public class RsaKeyConfig {

    @Bean
    public RSAPrivateKey rsaPrivateKey(@Value("${rsa.private-key}") Resource resource) throws IOException {
        try (InputStream input = resource.getInputStream()) {
            return RsaKeyConverters.pkcs8().convert(input);
        }
    }

    @Bean
    public RSAPublicKey rsaPublicKey(@Value("${rsa.public-key}") Resource resource) throws IOException {
        try (InputStream input = resource.getInputStream()) {
            return RsaKeyConverters.x509().convert(input);
        }
    }
}

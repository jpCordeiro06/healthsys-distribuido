import io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension

configure<DependencyManagementExtension> {
    imports {
        mavenBom("org.springframework.cloud:spring-cloud-dependencies:2025.0.3")
    }
}

dependencies {
    implementation("org.springframework.cloud:spring-cloud-starter-gateway")
}

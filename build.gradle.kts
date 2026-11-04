plugins {
    java
    id("org.springframework.boot") version "3.5.16" apply false
    id("io.spring.dependency-management") version "1.1.7" apply false
}

allprojects {
    group = "br.edu.healthsys"
    version = "0.1.0-SNAPSHOT"

    providers.environmentVariable("HEALTHSYS_BUILD_DIR").orNull?.let { buildRoot ->
        layout.buildDirectory.set(file("$buildRoot/${project.path.replace(':', '/')}"))
    }

    repositories {
        mavenCentral()
    }
}

configure(subprojects.filter { it.path.startsWith(":services:") }) {
    apply(plugin = "java")
    apply(plugin = "org.springframework.boot")
    apply(plugin = "io.spring.dependency-management")

    extensions.configure<JavaPluginExtension> {
        toolchain {
            languageVersion = JavaLanguageVersion.of(17)
        }
    }

    dependencies {
        "implementation"("org.springframework.boot:spring-boot-starter-actuator")
        "developmentOnly"("org.springframework.boot:spring-boot-devtools")
        "testImplementation"("org.springframework.boot:spring-boot-starter-test")
        "testRuntimeOnly"("org.junit.platform:junit-platform-launcher")
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
}

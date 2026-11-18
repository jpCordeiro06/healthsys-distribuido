dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.kafka:spring-kafka")
    implementation("org.postgresql:postgresql")
    implementation(project(":shared:security"))
    implementation(project(":shared:proto"))
    implementation("io.grpc:grpc-netty-shaded:1.68.1")
}

rootProject.name = "healthsys-distribuido"

include(
    "services:api-gateway",
    "services:user-service",
    "services:patient-service",
    "services:medical-record-service",
    "services:triage-service",
    "services:notification-service"
)

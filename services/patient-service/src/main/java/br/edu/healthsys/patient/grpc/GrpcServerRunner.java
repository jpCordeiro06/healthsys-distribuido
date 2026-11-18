package br.edu.healthsys.patient.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.stereotype.Component;

@Component
public class GrpcServerRunner implements SmartLifecycle {

    private static final Logger log = LoggerFactory.getLogger(GrpcServerRunner.class);

    private final int port;
    private final PatientGrpcServiceImpl patientGrpcService;
    private Server server;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public GrpcServerRunner(
            @Value("${grpc.server.port:9082}") int port,
            PatientGrpcServiceImpl patientGrpcService
    ) {
        this.port = port;
        this.patientGrpcService = patientGrpcService;
    }

    @Override
    public void start() {
        if (isRunning.compareAndSet(false, true)) {
            try {
                server = ServerBuilder.forPort(port)
                        .addService(patientGrpcService)
                        .build()
                        .start();
                log.info("gRPC server started on port {}", port);
            } catch (IOException e) {
                log.error("Failed to start gRPC server on port {}", port, e);
                isRunning.set(false);
                throw new IllegalStateException("Failed to start gRPC server", e);
            }
        }
    }

    @Override
    public void stop() {
        if (isRunning.compareAndSet(true, false) && server != null) {
            log.info("Shutting down gRPC server...");
            server.shutdown();
            try {
                if (!server.awaitTermination(5, TimeUnit.SECONDS)) {
                    server.shutdownNow();
                }
            } catch (InterruptedException e) {
                server.shutdownNow();
                Thread.currentThread().interrupt();
            }
            log.info("gRPC server stopped.");
        }
    }

    @Override
    public boolean isRunning() {
        return isRunning.get();
    }

    public int getPort() {
        return server != null ? server.getPort() : port;
    }
}

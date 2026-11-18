package br.edu.healthsys.record.listener;

import br.edu.healthsys.record.domain.MedicalRecord;
import br.edu.healthsys.record.domain.ProcessedEvent;
import br.edu.healthsys.record.repository.MedicalRecordRepository;
import br.edu.healthsys.record.repository.ProcessedEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientCreatedEventListenerTest {

    @Mock
    private ProcessedEventRepository processedEventRepository;

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private PatientCreatedEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new PatientCreatedEventListener(
                processedEventRepository,
                medicalRecordRepository,
                objectMapper
        );
    }

    @Test
    @DisplayName("Deve processar evento de paciente cadastrado e criar prontuario")
    void testHandlePatientCreatedSuccess() {
        UUID eventId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();

        String json = """
            {
                "eventId": "%s",
                "eventType": "pacientes.cadastrado",
                "payload": {
                    "idPaciente": "%s",
                    "nome": "Carlos Silva",
                    "dataNascimento": "1990-01-01"
                }
            }
            """.formatted(eventId, patientId);

        when(processedEventRepository.existsById(eventId)).thenReturn(false);
        when(medicalRecordRepository.existsByPatientId(patientId)).thenReturn(false);

        listener.handlePatientCreated(json);

        verify(medicalRecordRepository).save(any(MedicalRecord.class));
        verify(processedEventRepository).save(any(ProcessedEvent.class));
    }

    @Test
    @DisplayName("Deve ignorar evento duplicado (idempotencia)")
    void testHandlePatientCreatedDuplicate() {
        UUID eventId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();

        String json = """
            {
                "eventId": "%s",
                "eventType": "pacientes.cadastrado",
                "payload": {
                    "idPaciente": "%s"
                }
            }
            """.formatted(eventId, patientId);

        when(processedEventRepository.existsById(eventId)).thenReturn(true);

        listener.handlePatientCreated(json);

        verify(medicalRecordRepository, never()).save(any());
        verify(processedEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve ignorar DuplicateKeyException ao salvar prontuario concorrentemente")
    void testHandlePatientCreatedConcurrentDuplicateMedicalRecord() {
        UUID eventId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();

        String json = """
            {
                "eventId": "%s",
                "eventType": "pacientes.cadastrado",
                "payload": {
                    "idPaciente": "%s"
                }
            }
            """.formatted(eventId, patientId);

        when(processedEventRepository.existsById(eventId)).thenReturn(false);
        when(medicalRecordRepository.existsByPatientId(patientId)).thenReturn(false);
        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenThrow(new DuplicateKeyException("duplicate"));

        listener.handlePatientCreated(json);

        verify(medicalRecordRepository).save(any(MedicalRecord.class));
        verify(processedEventRepository).save(any(ProcessedEvent.class));
    }

    @Test
    @DisplayName("Deve ignorar DuplicateKeyException ao registrar evento processado concorrentemente")
    void testHandlePatientCreatedConcurrentDuplicateProcessedEvent() {
        UUID eventId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();

        String json = """
            {
                "eventId": "%s",
                "eventType": "pacientes.cadastrado",
                "payload": {
                    "idPaciente": "%s"
                }
            }
            """.formatted(eventId, patientId);

        when(processedEventRepository.existsById(eventId)).thenReturn(false);
        when(medicalRecordRepository.existsByPatientId(patientId)).thenReturn(false);
        when(processedEventRepository.save(any(ProcessedEvent.class))).thenThrow(new DuplicateKeyException("duplicate"));

        listener.handlePatientCreated(json);

        verify(medicalRecordRepository).save(any(MedicalRecord.class));
        verify(processedEventRepository).save(any(ProcessedEvent.class));
    }
}

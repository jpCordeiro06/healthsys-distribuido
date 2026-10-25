package br.edu.healthsys.patient.service;

import br.edu.healthsys.patient.api.PatientRequest;
import br.edu.healthsys.patient.api.PatientResponse;
import br.edu.healthsys.patient.domain.Patient;
import br.edu.healthsys.patient.repository.PatientRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PatientService {

    private final PatientRepository repository;

    public PatientService(PatientRepository repository) {
        this.repository = repository;
    }

    public PatientResponse create(PatientRequest request) {
        Patient patient = new Patient(request.nome().trim(), request.dataNascimento(),
                request.sexo().trim(), normalizePhone(request.telefone()));
        return PatientResponse.from(repository.save(patient));
    }

    @Transactional(readOnly = true)
    public Page<PatientResponse> list(Pageable pageable) {
        return repository.findAll(pageable).map(PatientResponse::from);
    }

    @Transactional(readOnly = true)
    public PatientResponse get(UUID id) {
        return PatientResponse.from(findPatient(id));
    }

    public PatientResponse update(UUID id, PatientRequest request) {
        Patient patient = findPatient(id);
        patient.update(request.nome().trim(), request.dataNascimento(), request.sexo().trim(),
                normalizePhone(request.telefone()));
        return PatientResponse.from(repository.save(patient));
    }

    public void delete(UUID id) {
        repository.delete(findPatient(id));
    }

    private Patient findPatient(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente nao encontrado."));
    }

    private String normalizePhone(String telefone) {
        if (telefone == null || telefone.isBlank()) {
            return null;
        }
        return telefone.trim();
    }
}

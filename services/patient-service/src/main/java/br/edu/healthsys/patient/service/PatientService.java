package br.edu.healthsys.patient.service;

import br.edu.healthsys.patient.api.PatientAllergyRequest;
import br.edu.healthsys.patient.api.PatientAllergyResponse;
import br.edu.healthsys.patient.api.PatientRequest;
import br.edu.healthsys.patient.api.PatientResponse;
import br.edu.healthsys.patient.api.PatientVaccineRequest;
import br.edu.healthsys.patient.api.PatientVaccineResponse;
import br.edu.healthsys.patient.domain.Patient;
import br.edu.healthsys.patient.domain.PatientAllergy;
import br.edu.healthsys.patient.domain.PatientVaccine;
import br.edu.healthsys.patient.repository.PatientRepository;
import br.edu.healthsys.patient.util.CpfValidator;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
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
    public PatientService(PatientRepository repository) { this.repository = repository; }

    public PatientResponse create(PatientRequest request) {
        String cpf = CpfValidator.normalize(request.cpf());
        if (repository.existsByCpf(cpf)) throw conflict("Ja existe um paciente cadastrado com este CPF.");
        Patient patient = new Patient(request.nome().trim(), cpf, request.dataNascimento(), request.sexo().trim(), normalize(request.telefone()));
        if (request.alergias() != null) request.alergias().forEach(item -> patient.addAllergy(toAllergy(item)));
        if (request.vacinas() != null) request.vacinas().forEach(item -> patient.addVaccine(toVaccine(item)));
        try { return PatientResponse.from(repository.saveAndFlush(patient)); }
        catch (DataIntegrityViolationException exception) { throw conflict("Ja existe um paciente cadastrado com este CPF."); }
    }

    @Transactional(readOnly = true)
    public Page<PatientResponse> list(Pageable pageable) { return repository.findAll(pageable).map(PatientResponse::from); }

    @Transactional(readOnly = true)
    public PatientResponse get(UUID id) { return PatientResponse.from(findPatient(id)); }

    public PatientResponse update(UUID id, PatientRequest request) {
        Patient patient = findPatient(id);
        String cpf = CpfValidator.normalize(request.cpf());
        if (repository.existsByCpf(cpf) && !patient.getCpf().equals(cpf)) throw conflict("Ja existe um paciente cadastrado com este CPF.");
        patient.update(request.nome().trim(), cpf, request.dataNascimento(), request.sexo().trim(), normalize(request.telefone()));
        if (request.alergias() != null) patient.replaceAllergies(request.alergias().stream().map(this::toAllergy).toList());
        if (request.vacinas() != null) patient.replaceVaccines(request.vacinas().stream().map(this::toVaccine).toList());
        try { return PatientResponse.from(repository.saveAndFlush(patient)); }
        catch (DataIntegrityViolationException exception) { throw conflict("Ja existe um paciente cadastrado com este CPF."); }
    }

    public void delete(UUID id) { repository.delete(findPatient(id)); }

    public PatientAllergyResponse addAllergy(UUID patientId, PatientAllergyRequest request) {
        Patient patient = findPatient(patientId); PatientAllergy allergy = toAllergy(request);
        patient.addAllergy(allergy); repository.save(patient); return PatientAllergyResponse.from(allergy);
    }
    @Transactional(readOnly = true)
    public java.util.List<PatientAllergyResponse> listAllergies(UUID patientId) {
        return findPatient(patientId).getAlergias().stream().map(PatientAllergyResponse::from).toList();
    }
    public PatientAllergyResponse updateAllergy(UUID patientId, UUID allergyId, PatientAllergyRequest request) {
        PatientAllergy allergy = findAllergy(patientId, allergyId); allergy.update(request.alergeno().trim(), normalize(request.reacao()), normalize(request.observacoes()));
        return PatientAllergyResponse.from(allergy);
    }
    public void deleteAllergy(UUID patientId, UUID allergyId) { findPatient(patientId).removeAllergy(findAllergy(patientId, allergyId)); }

    public PatientVaccineResponse addVaccine(UUID patientId, PatientVaccineRequest request) {
        Patient patient = findPatient(patientId); PatientVaccine vaccine = toVaccine(request);
        patient.addVaccine(vaccine); repository.save(patient); return PatientVaccineResponse.from(vaccine);
    }
    @Transactional(readOnly = true)
    public java.util.List<PatientVaccineResponse> listVaccines(UUID patientId) {
        return findPatient(patientId).getVacinas().stream().map(PatientVaccineResponse::from).toList();
    }
    public PatientVaccineResponse updateVaccine(UUID patientId, UUID vaccineId, PatientVaccineRequest request) {
        PatientVaccine vaccine = findVaccine(patientId, vaccineId);
        if (request.proximaDose() != null && request.proximaDose().isBefore(request.dataAplicacao())) throw badRequest("A proxima dose nao pode ser anterior a data de aplicacao.");
        vaccine.update(request.vacina().trim(), request.dose().trim(), request.dataAplicacao(), normalize(request.lote()), request.proximaDose());
        return PatientVaccineResponse.from(vaccine);
    }
    public void deleteVaccine(UUID patientId, UUID vaccineId) { findPatient(patientId).removeVaccine(findVaccine(patientId, vaccineId)); }

    private PatientAllergy toAllergy(PatientAllergyRequest r) { return new PatientAllergy(r.alergeno().trim(), normalize(r.reacao()), normalize(r.observacoes())); }
    private PatientVaccine toVaccine(PatientVaccineRequest r) {
        if (r.proximaDose() != null && r.proximaDose().isBefore(r.dataAplicacao())) throw badRequest("A proxima dose nao pode ser anterior a data de aplicacao.");
        return new PatientVaccine(r.vacina().trim(), r.dose().trim(), r.dataAplicacao(), normalize(r.lote()), r.proximaDose());
    }
    private Patient findPatient(UUID id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente nao encontrado.")); }
    private PatientAllergy findAllergy(UUID patientId, UUID allergyId) {
        return findPatient(patientId).getAlergias().stream().filter(a -> a.getId().equals(allergyId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alergia nao encontrada para este paciente."));
    }
    private PatientVaccine findVaccine(UUID patientId, UUID vaccineId) {
        return findPatient(patientId).getVacinas().stream().filter(v -> v.getId().equals(vaccineId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vacina nao encontrada para este paciente."));
    }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }
    private ResponseStatusException badRequest(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}

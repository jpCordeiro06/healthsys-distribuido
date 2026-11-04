package br.edu.healthsys.patient.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "patients", uniqueConstraints = @UniqueConstraint(name = "uk_patients_cpf", columnNames = "cpf"))
public class Patient {
    @Id private UUID id;

    @Column(nullable = false, length = 150) private String nome;
    @Column(nullable = false, length = 11) private String cpf;
    @Column(name = "data_nascimento", nullable = false) private LocalDate dataNascimento;
    @Column(nullable = false, length = 30) private String sexo;
    @Column(length = 30) private String telefone;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PatientAllergy> alergias = new ArrayList<>();

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PatientVaccine> vacinas = new ArrayList<>();

    protected Patient() {}

    public Patient(String nome, String cpf, LocalDate dataNascimento, String sexo, String telefone) {
        this.nome = nome;
        this.cpf = cpf;
        this.dataNascimento = dataNascimento;
        this.sexo = sexo;
        this.telefone = telefone;
    }

    @PrePersist
    void prePersist() { if (id == null) id = UUID.randomUUID(); }

    public void update(String nome, String cpf, LocalDate dataNascimento, String sexo, String telefone) {
        this.nome = nome; this.cpf = cpf; this.dataNascimento = dataNascimento; this.sexo = sexo; this.telefone = telefone;
    }

    public void replaceAllergies(List<PatientAllergy> items) {
        alergias.clear();
        if (items != null) items.forEach(this::addAllergy);
    }
    public void addAllergy(PatientAllergy item) { item.setPatient(this); alergias.add(item); }
    public void removeAllergy(PatientAllergy item) { alergias.remove(item); }
    public void replaceVaccines(List<PatientVaccine> items) {
        vacinas.clear();
        if (items != null) items.forEach(this::addVaccine);
    }
    public void addVaccine(PatientVaccine item) { item.setPatient(this); vacinas.add(item); }
    public void removeVaccine(PatientVaccine item) { vacinas.remove(item); }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getCpf() { return cpf; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public String getSexo() { return sexo; }
    public String getTelefone() { return telefone; }
    public List<PatientAllergy> getAlergias() { return alergias; }
    public List<PatientVaccine> getVacinas() { return vacinas; }
}

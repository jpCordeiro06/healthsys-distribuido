package br.edu.healthsys.patient.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "patient_vaccines")
public class PatientVaccine {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 150)
    private String vacina;

    @Column(nullable = false, length = 100)
    private String dose;

    @Column(name = "data_aplicacao", nullable = false)
    private LocalDate dataAplicacao;

    @Column(length = 100)
    private String lote;

    @Column(name = "proxima_dose")
    private LocalDate proximaDose;

    protected PatientVaccine() {}

    public PatientVaccine(String vacina, String dose, LocalDate dataAplicacao, String lote, LocalDate proximaDose) {
        update(vacina, dose, dataAplicacao, lote, proximaDose);
    }

    public void setPatient(Patient patient) { this.patient = patient; }
    public void update(String vacina, String dose, LocalDate dataAplicacao, String lote, LocalDate proximaDose) {
        this.vacina = vacina;
        this.dose = dose;
        this.dataAplicacao = dataAplicacao;
        this.lote = lote;
        this.proximaDose = proximaDose;
    }
    public UUID getId() { return id; }
    public String getVacina() { return vacina; }
    public String getDose() { return dose; }
    public LocalDate getDataAplicacao() { return dataAplicacao; }
    public String getLote() { return lote; }
    public LocalDate getProximaDose() { return proximaDose; }
}

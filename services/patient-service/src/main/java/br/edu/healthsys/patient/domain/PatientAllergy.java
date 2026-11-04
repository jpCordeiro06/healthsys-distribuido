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
import java.util.UUID;

@Entity
@Table(name = "patient_allergies")
public class PatientAllergy {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 150)
    private String alergeno;

    @Column(length = 500)
    private String reacao;

    @Column(length = 1000)
    private String observacoes;

    protected PatientAllergy() {}

    public PatientAllergy(String alergeno, String reacao, String observacoes) {
        update(alergeno, reacao, observacoes);
    }

    public void setPatient(Patient patient) { this.patient = patient; }
    public void update(String alergeno, String reacao, String observacoes) {
        this.alergeno = alergeno;
        this.reacao = reacao;
        this.observacoes = observacoes;
    }
    public UUID getId() { return id; }
    public String getAlergeno() { return alergeno; }
    public String getReacao() { return reacao; }
    public String getObservacoes() { return observacoes; }
}

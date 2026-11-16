package br.edu.healthsys.triage.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "risk_classifications")
public class RiskClassification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "priority_level", nullable = false)
    private Integer priorityLevel;

    @Column(nullable = false)
    private Boolean active = true;

    protected RiskClassification() {}

    public RiskClassification(String name, String description, Integer priorityLevel, Boolean active) {
        this.name = name;
        this.description = description;
        this.priorityLevel = priorityLevel;
        this.active = active != null ? active : true;
    }

    public void update(String name, String description, Integer priorityLevel, Boolean active) {
        this.name = name;
        this.description = description;
        this.priorityLevel = priorityLevel;
        if (active != null) {
            this.active = active;
        }
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public Integer getPriorityLevel() {
        return priorityLevel;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}

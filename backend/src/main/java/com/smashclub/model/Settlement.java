package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "settlements")
public class Settlement {
    @Id
    private String id;

    private String fromPlayerId;
    private String fromPlayerName;

    private String toPlayerId;
    private String toPlayerName;

    private BigDecimal amount = BigDecimal.ZERO;
    private SettlementStatus status = SettlementStatus.UNSETTLED;

    private LocalDateTime settlementDate;
    private String paymentReferenceId;
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Settlement() {}

    public Settlement(String fromPlayerId, String fromPlayerName, String toPlayerId, String toPlayerName, BigDecimal amount) {
        this.fromPlayerId = fromPlayerId;
        this.fromPlayerName = fromPlayerName;
        this.toPlayerId = toPlayerId;
        this.toPlayerName = toPlayerName;
        this.amount = amount;
        this.status = SettlementStatus.UNSETTLED;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFromPlayerId() { return fromPlayerId; }
    public void setFromPlayerId(String fromPlayerId) { this.fromPlayerId = fromPlayerId; }

    public String getFromPlayerName() { return fromPlayerName; }
    public void setFromPlayerName(String fromPlayerName) { this.fromPlayerName = fromPlayerName; }

    public String getToPlayerId() { return toPlayerId; }
    public void setToPlayerId(String toPlayerId) { this.toPlayerId = toPlayerId; }

    public String getToPlayerName() { return toPlayerName; }
    public void setToPlayerName(String toPlayerName) { this.toPlayerName = toPlayerName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public SettlementStatus getStatus() { return status; }
    public void setStatus(SettlementStatus status) { this.status = status; }

    public LocalDateTime getSettlementDate() { return settlementDate; }
    public void setSettlementDate(LocalDateTime settlementDate) { this.settlementDate = settlementDate; }

    public String getPaymentReferenceId() { return paymentReferenceId; }
    public void setPaymentReferenceId(String paymentReferenceId) { this.paymentReferenceId = paymentReferenceId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

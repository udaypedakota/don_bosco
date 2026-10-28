package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "payments")
public class Payment {
    @Id
    private String id;

    @Indexed(unique = true)
    private String paymentReferenceNumber; // E.g. "PAY-20261028-001"

    private String gameId;
    private String expenseId;

    private String payerPlayerId;
    private String payerPlayerName;

    private String payeePlayerId; // E.g., Organizer who paid court advance
    private String payeePlayerName;

    private BigDecimal amount = BigDecimal.ZERO;
    private PaymentMethod paymentMethod = PaymentMethod.UPI;

    @Indexed
    private String transactionReference; // E.g. UPI UTR number

    private LocalDateTime paymentDate = LocalDateTime.now();
    private PaymentStatus status = PaymentStatus.PAID;

    private boolean verifiedByAdmin = true;
    private String verifiedByUserId;
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Payment() {}

    public Payment(String paymentReferenceNumber, String gameId, String expenseId,
                   String payerPlayerId, String payerPlayerName,
                   String payeePlayerId, String payeePlayerName,
                   BigDecimal amount, PaymentMethod paymentMethod,
                   String transactionReference, PaymentStatus status) {
        this.paymentReferenceNumber = paymentReferenceNumber;
        this.gameId = gameId;
        this.expenseId = expenseId;
        this.payerPlayerId = payerPlayerId;
        this.payerPlayerName = payerPlayerName;
        this.payeePlayerId = payeePlayerId;
        this.payeePlayerName = payeePlayerName;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.status = status;
        this.paymentDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPaymentReferenceNumber() { return paymentReferenceNumber; }
    public void setPaymentReferenceNumber(String paymentReferenceNumber) { this.paymentReferenceNumber = paymentReferenceNumber; }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getExpenseId() { return expenseId; }
    public void setExpenseId(String expenseId) { this.expenseId = expenseId; }

    public String getPayerPlayerId() { return payerPlayerId; }
    public void setPayerPlayerId(String payerPlayerId) { this.payerPlayerId = payerPlayerId; }

    public String getPayerPlayerName() { return payerPlayerName; }
    public void setPayerPlayerName(String payerPlayerName) { this.payerPlayerName = payerPlayerName; }

    public String getPayeePlayerId() { return payeePlayerId; }
    public void setPayeePlayerId(String payeePlayerId) { this.payeePlayerId = payeePlayerId; }

    public String getPayeePlayerName() { return payeePlayerName; }
    public void setPayeePlayerName(String payeePlayerName) { this.payeePlayerName = payeePlayerName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public boolean isVerifiedByAdmin() { return verifiedByAdmin; }
    public void setVerifiedByAdmin(boolean verifiedByAdmin) { this.verifiedByAdmin = verifiedByAdmin; }

    public String getVerifiedByUserId() { return verifiedByUserId; }
    public void setVerifiedByUserId(String verifiedByUserId) { this.verifiedByUserId = verifiedByUserId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

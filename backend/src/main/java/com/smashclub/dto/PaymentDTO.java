package com.smashclub.dto;

import com.smashclub.model.PaymentMethod;
import com.smashclub.model.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDTO {

    public static class RecordPaymentRequest {
        private String gameId;
        private String expenseId;

        @NotBlank(message = "Payer player ID is required")
        private String payerPlayerId;

        private String payeePlayerId; // If null, defaults to game organizer or club

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1.00", message = "Amount must be at least ₹1.00")
        private BigDecimal amount;

        @NotNull(message = "Payment method is required")
        private PaymentMethod paymentMethod = PaymentMethod.UPI;

        private String transactionReference; // e.g., UPI UTR / ref
        private LocalDateTime paymentDate;
        private String notes;

        public RecordPaymentRequest() {}

        public String getGameId() { return gameId; }
        public void setGameId(String gameId) { this.gameId = gameId; }

        public String getExpenseId() { return expenseId; }
        public void setExpenseId(String expenseId) { this.expenseId = expenseId; }

        public String getPayerPlayerId() { return payerPlayerId; }
        public void setPayerPlayerId(String payerPlayerId) { this.payerPlayerId = payerPlayerId; }

        public String getPayeePlayerId() { return payeePlayerId; }
        public void setPayeePlayerId(String payeePlayerId) { this.payeePlayerId = payeePlayerId; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

        public String getTransactionReference() { return transactionReference; }
        public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

        public LocalDateTime getPaymentDate() { return paymentDate; }
        public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class PaymentResponse {
        private String id;
        private String paymentReferenceNumber;
        private String gameId;
        private String expenseId;
        private String payerPlayerId;
        private String payerPlayerName;
        private String payeePlayerId;
        private String payeePlayerName;
        private BigDecimal amount;
        private PaymentMethod paymentMethod;
        private String transactionReference;
        private LocalDateTime paymentDate;
        private PaymentStatus status;
        private boolean verifiedByAdmin;
        private String notes;
        private LocalDateTime createdAt;

        public PaymentResponse() {}

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

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}

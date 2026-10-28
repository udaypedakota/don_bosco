package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "expense_allocations")
public class ExpenseAllocation {
    @Id
    private String id;

    private String expenseId;
    private String gameId;
    private String playerId;
    private String playerName;

    private BigDecimal allocatedAmount = BigDecimal.ZERO;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private BigDecimal balanceAmount = BigDecimal.ZERO;

    private PaymentStatus status = PaymentStatus.PENDING;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public ExpenseAllocation() {}

    public ExpenseAllocation(String expenseId, String gameId, String playerId, String playerName, BigDecimal allocatedAmount) {
        this.expenseId = expenseId;
        this.gameId = gameId;
        this.playerId = playerId;
        this.playerName = playerName;
        this.allocatedAmount = allocatedAmount;
        this.paidAmount = BigDecimal.ZERO;
        this.balanceAmount = allocatedAmount;
        this.status = PaymentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateBalance() {
        BigDecimal alloc = allocatedAmount != null ? allocatedAmount : BigDecimal.ZERO;
        BigDecimal paid = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        this.balanceAmount = alloc.subtract(paid);
        if (this.balanceAmount.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = PaymentStatus.PAID;
            this.balanceAmount = BigDecimal.ZERO;
        } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
            this.status = PaymentStatus.PARTIALLY_PAID;
        } else {
            this.status = PaymentStatus.PENDING;
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getExpenseId() { return expenseId; }
    public void setExpenseId(String expenseId) { this.expenseId = expenseId; }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public BigDecimal getAllocatedAmount() { return allocatedAmount; }
    public void setAllocatedAmount(BigDecimal allocatedAmount) {
        this.allocatedAmount = allocatedAmount;
        updateBalance();
    }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
        updateBalance();
    }

    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "expenses")
public class Expense {
    @Id
    private String id;

    private String gameId;
    private String title;
    private String category; // COURT, SHUTTLE, REFRESHMENTS, MISC
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // Who paid upfront (e.g. Organizer)
    private String paidByPlayerId;
    private String paidByPlayerName;

    private SplitType splitType = SplitType.EQUAL;
    private int participantCount = 0;
    private boolean reconciled = false;
    private String status = "RECORDED"; // RECORDED, CANCELLED

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Expense() {}

    public Expense(String gameId, String title, String category, BigDecimal totalAmount, String paidByPlayerId, String paidByPlayerName, SplitType splitType) {
        this.gameId = gameId;
        this.title = title;
        this.category = category;
        this.totalAmount = totalAmount;
        this.paidByPlayerId = paidByPlayerId;
        this.paidByPlayerName = paidByPlayerName;
        this.splitType = splitType;
        this.reconciled = true;
        this.status = "RECORDED";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getPaidByPlayerId() { return paidByPlayerId; }
    public void setPaidByPlayerId(String paidByPlayerId) { this.paidByPlayerId = paidByPlayerId; }

    public String getPaidByPlayerName() { return paidByPlayerName; }
    public void setPaidByPlayerName(String paidByPlayerName) { this.paidByPlayerName = paidByPlayerName; }

    public SplitType getSplitType() { return splitType; }
    public void setSplitType(SplitType splitType) { this.splitType = splitType; }

    public int getParticipantCount() { return participantCount; }
    public void setParticipantCount(int participantCount) { this.participantCount = participantCount; }

    public boolean isReconciled() { return reconciled; }
    public void setReconciled(boolean reconciled) { this.reconciled = reconciled; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

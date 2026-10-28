package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "players")
public class Player {
    @Id
    private String id;

    @Indexed(unique = true)
    private String uniquePlayerId; // e.g., "SC-001"

    private String name;

    @Indexed(unique = true)
    private String mobileNumber;

    private String email;
    private String avatarUrl;
    private LocalDate joinDate = LocalDate.now();
    private boolean active = true;

    // Financial & Game Summaries
    private int totalGamesPlayed = 0;
    private BigDecimal totalExpenseShare = BigDecimal.ZERO;
    private BigDecimal totalPaid = BigDecimal.ZERO;
    private BigDecimal outstandingBalance = BigDecimal.ZERO;

    // Invitation token for activation
    private String invitationToken;
    private boolean accountActivated = false;

    private String notes;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Player() {}

    public Player(String uniquePlayerId, String name, String mobileNumber, String email, String avatarUrl) {
        this.uniquePlayerId = uniquePlayerId;
        this.name = name;
        this.mobileNumber = mobileNumber;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.joinDate = LocalDate.now();
        this.active = true;
        this.totalGamesPlayed = 0;
        this.totalExpenseShare = BigDecimal.ZERO;
        this.totalPaid = BigDecimal.ZERO;
        this.outstandingBalance = BigDecimal.ZERO;
        this.accountActivated = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUniquePlayerId() { return uniquePlayerId; }
    public void setUniquePlayerId(String uniquePlayerId) { this.uniquePlayerId = uniquePlayerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public LocalDate getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getTotalGamesPlayed() { return totalGamesPlayed; }
    public void setTotalGamesPlayed(int totalGamesPlayed) { this.totalGamesPlayed = totalGamesPlayed; }

    public BigDecimal getTotalExpenseShare() { return totalExpenseShare; }
    public void setTotalExpenseShare(BigDecimal totalExpenseShare) { this.totalExpenseShare = totalExpenseShare; }

    public BigDecimal getTotalPaid() { return totalPaid; }
    public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }

    public BigDecimal getOutstandingBalance() { return outstandingBalance; }
    public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }

    public String getInvitationToken() { return invitationToken; }
    public void setInvitationToken(String invitationToken) { this.invitationToken = invitationToken; }

    public boolean isAccountActivated() { return accountActivated; }
    public void setAccountActivated(boolean accountActivated) { this.accountActivated = accountActivated; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

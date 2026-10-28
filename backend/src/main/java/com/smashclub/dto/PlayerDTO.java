package com.smashclub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PlayerDTO {

    public static class CreatePlayerRequest {
        @NotBlank(message = "Player name is required")
        private String name;

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be exactly 10 digits")
        private String mobileNumber;

        private String email;
        private String avatarUrl;
        private String notes;

        public CreatePlayerRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class UpdatePlayerRequest {
        @NotBlank(message = "Player name is required")
        private String name;

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be exactly 10 digits")
        private String mobileNumber;

        private String email;
        private String avatarUrl;
        private boolean active;
        private String notes;

        public UpdatePlayerRequest() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class PlayerResponse {
        private String id;
        private String uniquePlayerId;
        private String name;
        private String mobileNumber;
        private String email;
        private String avatarUrl;
        private LocalDate joinDate;
        private boolean active;
        private int totalGamesPlayed;
        private BigDecimal totalExpenseShare;
        private BigDecimal totalPaid;
        private BigDecimal outstandingBalance;
        private boolean accountActivated;
        private String notes;

        public PlayerResponse() {}

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

        public boolean isAccountActivated() { return accountActivated; }
        public void setAccountActivated(boolean accountActivated) { this.accountActivated = accountActivated; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class InvitePlayerResponse {
        private String invitationToken;
        private String invitationLink;
        private String playerName;
        private String mobileNumber;

        public InvitePlayerResponse(String invitationToken, String invitationLink, String playerName, String mobileNumber) {
            this.invitationToken = invitationToken;
            this.invitationLink = invitationLink;
            this.playerName = playerName;
            this.mobileNumber = mobileNumber;
        }

        public String getInvitationToken() { return invitationToken; }
        public String getInvitationLink() { return invitationLink; }
        public String getPlayerName() { return playerName; }
        public String getMobileNumber() { return mobileNumber; }
    }
}

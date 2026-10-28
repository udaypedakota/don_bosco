package com.smashclub.dto;

import com.smashclub.model.SplitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class GameDTO {

    public static class CreateGameRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Court name is required")
        private String courtName;

        private String location;

        @NotNull(message = "Game date is required")
        private LocalDate gameDate;

        private LocalTime startTime;
        private LocalTime endTime;

        private BigDecimal courtBookingCost = BigDecimal.ZERO;
        private BigDecimal shuttlecockExpenses = BigDecimal.ZERO;
        private BigDecimal additionalExpenses = BigDecimal.ZERO;

        @NotBlank(message = "Organizer ID is required")
        private String organizerPlayerId;

        private SplitType splitType = SplitType.EQUAL;
        private String notes;
        private List<String> participantPlayerIds = new ArrayList<>();

        public CreateGameRequest() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCourtName() { return courtName; }
        public void setCourtName(String courtName) { this.courtName = courtName; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public LocalDate getGameDate() { return gameDate; }
        public void setGameDate(LocalDate gameDate) { this.gameDate = gameDate; }

        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

        public BigDecimal getCourtBookingCost() { return courtBookingCost; }
        public void setCourtBookingCost(BigDecimal courtBookingCost) { this.courtBookingCost = courtBookingCost; }

        public BigDecimal getShuttlecockExpenses() { return shuttlecockExpenses; }
        public void setShuttlecockExpenses(BigDecimal shuttlecockExpenses) { this.shuttlecockExpenses = shuttlecockExpenses; }

        public BigDecimal getAdditionalExpenses() { return additionalExpenses; }
        public void setAdditionalExpenses(BigDecimal additionalExpenses) { this.additionalExpenses = additionalExpenses; }

        public String getOrganizerPlayerId() { return organizerPlayerId; }
        public void setOrganizerPlayerId(String organizerPlayerId) { this.organizerPlayerId = organizerPlayerId; }

        public SplitType getSplitType() { return splitType; }
        public void setSplitType(SplitType splitType) { this.splitType = splitType; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public List<String> getParticipantPlayerIds() { return participantPlayerIds; }
        public void setParticipantPlayerIds(List<String> participantPlayerIds) { this.participantPlayerIds = participantPlayerIds; }
    }

    public static class UpdateGameRequest {
        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Court name is required")
        private String courtName;

        private String location;
        private LocalDate gameDate;
        private LocalTime startTime;
        private LocalTime endTime;

        private BigDecimal courtBookingCost;
        private BigDecimal shuttlecockExpenses;
        private BigDecimal additionalExpenses;

        private String organizerPlayerId;
        private String status; // SCHEDULED, COMPLETED, CANCELLED
        private SplitType splitType;
        private String notes;
        private List<String> participantPlayerIds = new ArrayList<>();
        private List<String> attendedPlayerIds = new ArrayList<>();

        public UpdateGameRequest() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCourtName() { return courtName; }
        public void setCourtName(String courtName) { this.courtName = courtName; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public LocalDate getGameDate() { return gameDate; }
        public void setGameDate(LocalDate gameDate) { this.gameDate = gameDate; }

        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

        public BigDecimal getCourtBookingCost() { return courtBookingCost; }
        public void setCourtBookingCost(BigDecimal courtBookingCost) { this.courtBookingCost = courtBookingCost; }

        public BigDecimal getShuttlecockExpenses() { return shuttlecockExpenses; }
        public void setShuttlecockExpenses(BigDecimal shuttlecockExpenses) { this.shuttlecockExpenses = shuttlecockExpenses; }

        public BigDecimal getAdditionalExpenses() { return additionalExpenses; }
        public void setAdditionalExpenses(BigDecimal additionalExpenses) { this.additionalExpenses = additionalExpenses; }

        public String getOrganizerPlayerId() { return organizerPlayerId; }
        public void setOrganizerPlayerId(String organizerPlayerId) { this.organizerPlayerId = organizerPlayerId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public SplitType getSplitType() { return splitType; }
        public void setSplitType(SplitType splitType) { this.splitType = splitType; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public List<String> getParticipantPlayerIds() { return participantPlayerIds; }
        public void setParticipantPlayerIds(List<String> participantPlayerIds) { this.participantPlayerIds = participantPlayerIds; }

        public List<String> getAttendedPlayerIds() { return attendedPlayerIds; }
        public void setAttendedPlayerIds(List<String> attendedPlayerIds) { this.attendedPlayerIds = attendedPlayerIds; }
    }

    public static class AttendanceUpdateRequest {
        @NotNull(message = "Attended player IDs list is required")
        private List<String> attendedPlayerIds = new ArrayList<>();
        private boolean confirmAndRecalculateFinancials = false;

        public AttendanceUpdateRequest() {}

        public List<String> getAttendedPlayerIds() { return attendedPlayerIds; }
        public void setAttendedPlayerIds(List<String> attendedPlayerIds) { this.attendedPlayerIds = attendedPlayerIds; }

        public boolean isConfirmAndRecalculateFinancials() { return confirmAndRecalculateFinancials; }
        public void setConfirmAndRecalculateFinancials(boolean confirmAndRecalculateFinancials) { this.confirmAndRecalculateFinancials = confirmAndRecalculateFinancials; }
    }

    public static class GameResponse {
        private String id;
        private String title;
        private String courtName;
        private String location;
        private LocalDate gameDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private BigDecimal courtBookingCost;
        private BigDecimal shuttlecockExpenses;
        private BigDecimal additionalExpenses;
        private BigDecimal totalCost;
        private String organizerPlayerId;
        private String organizerName;
        private String status;
        private SplitType splitType;
        private boolean financialConfirmed;
        private String notes;
        private List<ParticipantInfo> participants = new ArrayList<>();
        private BigDecimal perPlayerEstimatedShare;

        public GameResponse() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCourtName() { return courtName; }
        public void setCourtName(String courtName) { this.courtName = courtName; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public LocalDate getGameDate() { return gameDate; }
        public void setGameDate(LocalDate gameDate) { this.gameDate = gameDate; }

        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

        public BigDecimal getCourtBookingCost() { return courtBookingCost; }
        public void setCourtBookingCost(BigDecimal courtBookingCost) { this.courtBookingCost = courtBookingCost; }

        public BigDecimal getShuttlecockExpenses() { return shuttlecockExpenses; }
        public void setShuttlecockExpenses(BigDecimal shuttlecockExpenses) { this.shuttlecockExpenses = shuttlecockExpenses; }

        public BigDecimal getAdditionalExpenses() { return additionalExpenses; }
        public void setAdditionalExpenses(BigDecimal additionalExpenses) { this.additionalExpenses = additionalExpenses; }

        public BigDecimal getTotalCost() { return totalCost; }
        public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }

        public String getOrganizerPlayerId() { return organizerPlayerId; }
        public void setOrganizerPlayerId(String organizerPlayerId) { this.organizerPlayerId = organizerPlayerId; }

        public String getOrganizerName() { return organizerName; }
        public void setOrganizerName(String organizerName) { this.organizerName = organizerName; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public SplitType getSplitType() { return splitType; }
        public void setSplitType(SplitType splitType) { this.splitType = splitType; }

        public boolean isFinancialConfirmed() { return financialConfirmed; }
        public void setFinancialConfirmed(boolean financialConfirmed) { this.financialConfirmed = financialConfirmed; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public List<ParticipantInfo> getParticipants() { return participants; }
        public void setParticipants(List<ParticipantInfo> participants) { this.participants = participants; }

        public BigDecimal getPerPlayerEstimatedShare() { return perPlayerEstimatedShare; }
        public void setPerPlayerEstimatedShare(BigDecimal perPlayerEstimatedShare) { this.perPlayerEstimatedShare = perPlayerEstimatedShare; }
    }

    public static class ParticipantInfo {
        private String playerId;
        private String playerName;
        private String avatarUrl;
        private boolean attended;
        private BigDecimal shareAmount;
        private BigDecimal paidAmount;
        private String paymentStatus;

        public ParticipantInfo() {}

        public ParticipantInfo(String playerId, String playerName, String avatarUrl, boolean attended, BigDecimal shareAmount, BigDecimal paidAmount, String paymentStatus) {
            this.playerId = playerId;
            this.playerName = playerName;
            this.avatarUrl = avatarUrl;
            this.attended = attended;
            this.shareAmount = shareAmount;
            this.paidAmount = paidAmount;
            this.paymentStatus = paymentStatus;
        }

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }

        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

        public boolean isAttended() { return attended; }
        public void setAttended(boolean attended) { this.attended = attended; }

        public BigDecimal getShareAmount() { return shareAmount; }
        public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }

        public BigDecimal getPaidAmount() { return paidAmount; }
        public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    }
}

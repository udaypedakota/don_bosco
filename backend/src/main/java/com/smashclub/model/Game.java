package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "games")
public class Game {
    @Id
    private String id;

    private String title;
    private String courtName;
    private String location;
    private LocalDate gameDate;
    private LocalTime startTime;
    private LocalTime endTime;

    // Costs
    private BigDecimal courtBookingCost = BigDecimal.ZERO;
    private BigDecimal shuttlecockExpenses = BigDecimal.ZERO;
    private BigDecimal additionalExpenses = BigDecimal.ZERO;
    private BigDecimal totalCost = BigDecimal.ZERO;

    // Organizer details
    private String organizerPlayerId;
    private String organizerName;

    // Status: SCHEDULED, COMPLETED, CANCELLED
    private String status = "SCHEDULED";

    // Split configuration
    private SplitType splitType = SplitType.EQUAL;
    private boolean financialConfirmed = false;

    private String notes;
    private List<String> participantPlayerIds = new ArrayList<>();
    private List<String> attendedPlayerIds = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Game() {}

    public void recalculateTotalCost() {
        BigDecimal court = courtBookingCost != null ? courtBookingCost : BigDecimal.ZERO;
        BigDecimal shuttle = shuttlecockExpenses != null ? shuttlecockExpenses : BigDecimal.ZERO;
        BigDecimal addl = additionalExpenses != null ? additionalExpenses : BigDecimal.ZERO;
        this.totalCost = court.add(shuttle).add(addl);
    }

    // Getters and Setters
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
    public void setCourtBookingCost(BigDecimal courtBookingCost) {
        this.courtBookingCost = courtBookingCost;
        recalculateTotalCost();
    }

    public BigDecimal getShuttlecockExpenses() { return shuttlecockExpenses; }
    public void setShuttlecockExpenses(BigDecimal shuttlecockExpenses) {
        this.shuttlecockExpenses = shuttlecockExpenses;
        recalculateTotalCost();
    }

    public BigDecimal getAdditionalExpenses() { return additionalExpenses; }
    public void setAdditionalExpenses(BigDecimal additionalExpenses) {
        this.additionalExpenses = additionalExpenses;
        recalculateTotalCost();
    }

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

    public List<String> getParticipantPlayerIds() { return participantPlayerIds; }
    public void setParticipantPlayerIds(List<String> participantPlayerIds) { this.participantPlayerIds = participantPlayerIds; }

    public List<String> getAttendedPlayerIds() { return attendedPlayerIds; }
    public void setAttendedPlayerIds(List<String> attendedPlayerIds) { this.attendedPlayerIds = attendedPlayerIds; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

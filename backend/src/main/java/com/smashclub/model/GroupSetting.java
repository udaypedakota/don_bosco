package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "group_settings")
public class GroupSetting {
    @Id
    private String id;

    private String groupName = "Smash Club";
    private String currency = "INR";
    private String currencySymbol = "₹";
    private String timezone = "Asia/Kolkata";
    private String defaultCourtName = "Star Badminton Arena, Court 3";
    private BigDecimal defaultCourtCost = new BigDecimal("600.00");
    private BigDecimal defaultShuttleCost = new BigDecimal("240.00");
    private String announcement = "Welcome to Smash Club! Morning sessions every Mon, Wed, Fri & Sat 6:00 AM - 8:00 AM.";

    private LocalDateTime updatedAt = LocalDateTime.now();

    public GroupSetting() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getDefaultCourtName() { return defaultCourtName; }
    public void setDefaultCourtName(String defaultCourtName) { this.defaultCourtName = defaultCourtName; }

    public BigDecimal getDefaultCourtCost() { return defaultCourtCost; }
    public void setDefaultCourtCost(BigDecimal defaultCourtCost) { this.defaultCourtCost = defaultCourtCost; }

    public BigDecimal getDefaultShuttleCost() { return defaultShuttleCost; }
    public void setDefaultShuttleCost(BigDecimal defaultShuttleCost) { this.defaultShuttleCost = defaultShuttleCost; }

    public String getAnnouncement() { return announcement; }
    public void setAnnouncement(String announcement) { this.announcement = announcement; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

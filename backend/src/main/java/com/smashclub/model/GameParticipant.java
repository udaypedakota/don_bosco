package com.smashclub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(collection = "game_participants")
public class GameParticipant {
    @Id
    private String id;
    private String gameId;
    private String playerId;
    private String playerName;
    private boolean attended = true;
    private BigDecimal shareAmount = BigDecimal.ZERO;
    private BigDecimal customFixedAmount = BigDecimal.ZERO;
    private BigDecimal customPercentage = BigDecimal.ZERO;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    public GameParticipant() {}

    public GameParticipant(String gameId, String playerId, String playerName) {
        this.gameId = gameId;
        this.playerId = playerId;
        this.playerName = playerName;
        this.attended = true;
        this.shareAmount = BigDecimal.ZERO;
        this.paidAmount = BigDecimal.ZERO;
        this.paymentStatus = PaymentStatus.PENDING;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }

    public String getPlayerName() { return playerName; }
    public void setPlayerName(String playerName) { this.playerName = playerName; }

    public boolean isAttended() { return attended; }
    public void setAttended(boolean attended) { this.attended = attended; }

    public BigDecimal getShareAmount() { return shareAmount; }
    public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }

    public BigDecimal getCustomFixedAmount() { return customFixedAmount; }
    public void setCustomFixedAmount(BigDecimal customFixedAmount) { this.customFixedAmount = customFixedAmount; }

    public BigDecimal getCustomPercentage() { return customPercentage; }
    public void setCustomPercentage(BigDecimal customPercentage) { this.customPercentage = customPercentage; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
}

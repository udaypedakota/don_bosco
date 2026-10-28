package com.smashclub.dto;

import com.smashclub.model.SplitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ExpenseSplitDTO {

    public static class CalculateSplitRequest {
        @NotNull(message = "Total expense amount is required")
        private BigDecimal totalAmount;

        @NotNull(message = "Split type is required")
        private SplitType splitType = SplitType.EQUAL;

        private List<PlayerShareRequest> playerAllocations = new ArrayList<>();

        public CalculateSplitRequest() {}

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

        public SplitType getSplitType() { return splitType; }
        public void setSplitType(SplitType splitType) { this.splitType = splitType; }

        public List<PlayerShareRequest> getPlayerAllocations() { return playerAllocations; }
        public void setPlayerAllocations(List<PlayerShareRequest> playerAllocations) { this.playerAllocations = playerAllocations; }
    }

    public static class PlayerShareRequest {
        private String playerId;
        private String playerName;
        private BigDecimal customFixedAmount;
        private BigDecimal customPercentage;

        public PlayerShareRequest() {}

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }

        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }

        public BigDecimal getCustomFixedAmount() { return customFixedAmount; }
        public void setCustomFixedAmount(BigDecimal customFixedAmount) { this.customFixedAmount = customFixedAmount; }

        public BigDecimal getCustomPercentage() { return customPercentage; }
        public void setCustomPercentage(BigDecimal customPercentage) { this.customPercentage = customPercentage; }
    }

    public static class SplitAllocationPreview {
        private String gameId;
        private BigDecimal totalExpense;
        private SplitType splitType;
        private int participantCount;
        private List<AllocatedShareDetail> shares = new ArrayList<>();
        private BigDecimal totalAllocated;
        private BigDecimal roundingAdjustment;
        private boolean reconciled;

        public SplitAllocationPreview() {}

        public String getGameId() { return gameId; }
        public void setGameId(String gameId) { this.gameId = gameId; }

        public BigDecimal getTotalExpense() { return totalExpense; }
        public void setTotalExpense(BigDecimal totalExpense) { this.totalExpense = totalExpense; }

        public SplitType getSplitType() { return splitType; }
        public void setSplitType(SplitType splitType) { this.splitType = splitType; }

        public int getParticipantCount() { return participantCount; }
        public void setParticipantCount(int participantCount) { this.participantCount = participantCount; }

        public List<AllocatedShareDetail> getShares() { return shares; }
        public void setShares(List<AllocatedShareDetail> shares) { this.shares = shares; }

        public BigDecimal getTotalAllocated() { return totalAllocated; }
        public void setTotalAllocated(BigDecimal totalAllocated) { this.totalAllocated = totalAllocated; }

        public BigDecimal getRoundingAdjustment() { return roundingAdjustment; }
        public void setRoundingAdjustment(BigDecimal roundingAdjustment) { this.roundingAdjustment = roundingAdjustment; }

        public boolean isReconciled() { return reconciled; }
        public void setReconciled(boolean reconciled) { this.reconciled = reconciled; }
    }

    public static class AllocatedShareDetail {
        private String playerId;
        private String playerName;
        private BigDecimal shareAmount;
        private BigDecimal percentage;
        private BigDecimal previousShareAmount;
        private BigDecimal difference; // positive = increase, negative = decrease

        public AllocatedShareDetail() {}

        public AllocatedShareDetail(String playerId, String playerName, BigDecimal shareAmount, BigDecimal percentage) {
            this.playerId = playerId;
            this.playerName = playerName;
            this.shareAmount = shareAmount;
            this.percentage = percentage;
        }

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }

        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }

        public BigDecimal getShareAmount() { return shareAmount; }
        public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }

        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }

        public BigDecimal getPreviousShareAmount() { return previousShareAmount; }
        public void setPreviousShareAmount(BigDecimal previousShareAmount) { this.previousShareAmount = previousShareAmount; }

        public BigDecimal getDifference() { return difference; }
        public void setDifference(BigDecimal difference) { this.difference = difference; }
    }

    public static class ConfirmSplitRequest {
        @NotBlank(message = "Game ID is required")
        private String gameId;

        @NotNull(message = "Split type is required")
        private SplitType splitType;

        private List<PlayerShareRequest> allocations = new ArrayList<>();

        public ConfirmSplitRequest() {}

        public String getGameId() { return gameId; }
        public void setGameId(String gameId) { this.gameId = gameId; }

        public SplitType getSplitType() { return splitType; }
        public void setSplitType(SplitType splitType) { this.splitType = splitType; }

        public List<PlayerShareRequest> getAllocations() { return allocations; }
        public void setAllocations(List<PlayerShareRequest> allocations) { this.allocations = allocations; }
    }
}

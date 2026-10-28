package com.smashclub.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ReportDTO {

    public static class AdminDashboardStats {
        private int totalActivePlayers;
        private int totalGamesCount;
        private int upcomingGamesCount;
        private BigDecimal monthlyExpenses;
        private BigDecimal paymentsCollected;
        private BigDecimal outstandingBalance;
        private List<MonthlyExpensePoint> monthlyTrends = new ArrayList<>();
        private List<CategoryExpensePoint> categoryBreakdown = new ArrayList<>();

        public AdminDashboardStats() {}

        public int getTotalActivePlayers() { return totalActivePlayers; }
        public void setTotalActivePlayers(int totalActivePlayers) { this.totalActivePlayers = totalActivePlayers; }

        public int getTotalGamesCount() { return totalGamesCount; }
        public void setTotalGamesCount(int totalGamesCount) { this.totalGamesCount = totalGamesCount; }

        public int getUpcomingGamesCount() { return upcomingGamesCount; }
        public void setUpcomingGamesCount(int upcomingGamesCount) { this.upcomingGamesCount = upcomingGamesCount; }

        public BigDecimal getMonthlyExpenses() { return monthlyExpenses; }
        public void setMonthlyExpenses(BigDecimal monthlyExpenses) { this.monthlyExpenses = monthlyExpenses; }

        public BigDecimal getPaymentsCollected() { return paymentsCollected; }
        public void setPaymentsCollected(BigDecimal paymentsCollected) { this.paymentsCollected = paymentsCollected; }

        public BigDecimal getOutstandingBalance() { return outstandingBalance; }
        public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }

        public List<MonthlyExpensePoint> getMonthlyTrends() { return monthlyTrends; }
        public void setMonthlyTrends(List<MonthlyExpensePoint> monthlyTrends) { this.monthlyTrends = monthlyTrends; }

        public List<CategoryExpensePoint> getCategoryBreakdown() { return categoryBreakdown; }
        public void setCategoryBreakdown(List<CategoryExpensePoint> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
    }

    public static class PlayerDashboardStats {
        private String playerId;
        private String playerName;
        private int gamesAttended;
        private BigDecimal totalExpenseShare;
        private BigDecimal totalPaymentsMade;
        private BigDecimal outstandingBalance;
        private int upcomingGamesCount;
        private List<MonthlyExpensePoint> personalExpenseTrends = new ArrayList<>();

        public PlayerDashboardStats() {}

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }

        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }

        public int getGamesAttended() { return gamesAttended; }
        public void setGamesAttended(int gamesAttended) { this.gamesAttended = gamesAttended; }

        public BigDecimal getTotalExpenseShare() { return totalExpenseShare; }
        public void setTotalExpenseShare(BigDecimal totalExpenseShare) { this.totalExpenseShare = totalExpenseShare; }

        public BigDecimal getTotalPaymentsMade() { return totalPaymentsMade; }
        public void setTotalPaymentsMade(BigDecimal totalPaymentsMade) { this.totalPaymentsMade = totalPaymentsMade; }

        public BigDecimal getOutstandingBalance() { return outstandingBalance; }
        public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }

        public int getUpcomingGamesCount() { return upcomingGamesCount; }
        public void setUpcomingGamesCount(int upcomingGamesCount) { this.upcomingGamesCount = upcomingGamesCount; }

        public List<MonthlyExpensePoint> getPersonalExpenseTrends() { return personalExpenseTrends; }
        public void setPersonalExpenseTrends(List<MonthlyExpensePoint> personalExpenseTrends) { this.personalExpenseTrends = personalExpenseTrends; }
    }

    public static class MonthlyExpensePoint {
        private String month; // e.g. "Oct 2026"
        private BigDecimal totalExpense;
        private BigDecimal totalPaid;
        private int gamesPlayed;

        public MonthlyExpensePoint() {}

        public MonthlyExpensePoint(String month, BigDecimal totalExpense, BigDecimal totalPaid, int gamesPlayed) {
            this.month = month;
            this.totalExpense = totalExpense;
            this.totalPaid = totalPaid;
            this.gamesPlayed = gamesPlayed;
        }

        public String getMonth() { return month; }
        public void setMonth(String month) { this.month = month; }

        public BigDecimal getTotalExpense() { return totalExpense; }
        public void setTotalExpense(BigDecimal totalExpense) { this.totalExpense = totalExpense; }

        public BigDecimal getTotalPaid() { return totalPaid; }
        public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }

        public int getGamesPlayed() { return gamesPlayed; }
        public void setGamesPlayed(int gamesPlayed) { this.gamesPlayed = gamesPlayed; }
    }

    public static class CategoryExpensePoint {
        private String category;
        private BigDecimal amount;
        private double percentage;

        public CategoryExpensePoint() {}

        public CategoryExpensePoint(String category, BigDecimal amount, double percentage) {
            this.category = category;
            this.amount = amount;
            this.percentage = percentage;
        }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
    }

    public static class PlayerFinancialStatement {
        private String playerId;
        private String playerName;
        private String uniquePlayerId;
        private int gamesPlayed;
        private BigDecimal totalShare;
        private BigDecimal totalPaid;
        private BigDecimal outstandingBalance;
        private String status;

        public PlayerFinancialStatement() {}

        public PlayerFinancialStatement(String playerId, String playerName, String uniquePlayerId, int gamesPlayed, BigDecimal totalShare, BigDecimal totalPaid, BigDecimal outstandingBalance, String status) {
            this.playerId = playerId;
            this.playerName = playerName;
            this.uniquePlayerId = uniquePlayerId;
            this.gamesPlayed = gamesPlayed;
            this.totalShare = totalShare;
            this.totalPaid = totalPaid;
            this.outstandingBalance = outstandingBalance;
            this.status = status;
        }

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }

        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }

        public String getUniquePlayerId() { return uniquePlayerId; }
        public void setUniquePlayerId(String uniquePlayerId) { this.uniquePlayerId = uniquePlayerId; }

        public int getGamesPlayed() { return gamesPlayed; }
        public void setGamesPlayed(int gamesPlayed) { this.gamesPlayed = gamesPlayed; }

        public BigDecimal getTotalShare() { return totalShare; }
        public void setTotalShare(BigDecimal totalShare) { this.totalShare = totalShare; }

        public BigDecimal getTotalPaid() { return totalPaid; }
        public void setTotalPaid(BigDecimal totalPaid) { this.totalPaid = totalPaid; }

        public BigDecimal getOutstandingBalance() { return outstandingBalance; }
        public void setOutstandingBalance(BigDecimal outstandingBalance) { this.outstandingBalance = outstandingBalance; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}

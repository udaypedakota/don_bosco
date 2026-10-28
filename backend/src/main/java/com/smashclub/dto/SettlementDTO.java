package com.smashclub.dto;

import com.smashclub.model.PaymentMethod;
import com.smashclub.model.SettlementStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SettlementDTO {

    public static class SettlementSummaryResponse {
        private BigDecimal totalGroupExpenses;
        private BigDecimal totalPaymentsCollected;
        private BigDecimal totalOutstandingBalance;
        private int totalUnsettledDebts;
        private List<DebtPair> directDebts = new ArrayList<>();
        private List<SimplifiedDebt> simplifiedDebts = new ArrayList<>();
        private List<PlayerNetBalance> netBalances = new ArrayList<>();

        public SettlementSummaryResponse() {}

        public BigDecimal getTotalGroupExpenses() { return totalGroupExpenses; }
        public void setTotalGroupExpenses(BigDecimal totalGroupExpenses) { this.totalGroupExpenses = totalGroupExpenses; }

        public BigDecimal getTotalPaymentsCollected() { return totalPaymentsCollected; }
        public void setTotalPaymentsCollected(BigDecimal totalPaymentsCollected) { this.totalPaymentsCollected = totalPaymentsCollected; }

        public BigDecimal getTotalOutstandingBalance() { return totalOutstandingBalance; }
        public void setTotalOutstandingBalance(BigDecimal totalOutstandingBalance) { this.totalOutstandingBalance = totalOutstandingBalance; }

        public int getTotalUnsettledDebts() { return totalUnsettledDebts; }
        public void setTotalUnsettledDebts(int totalUnsettledDebts) { this.totalUnsettledDebts = totalUnsettledDebts; }

        public List<DebtPair> getDirectDebts() { return directDebts; }
        public void setDirectDebts(List<DebtPair> directDebts) { this.directDebts = directDebts; }

        public List<SimplifiedDebt> getSimplifiedDebts() { return simplifiedDebts; }
        public void setSimplifiedDebts(List<SimplifiedDebt> simplifiedDebts) { this.simplifiedDebts = simplifiedDebts; }

        public List<PlayerNetBalance> getNetBalances() { return netBalances; }
        public void setNetBalances(List<PlayerNetBalance> netBalances) { this.netBalances = netBalances; }
    }

    public static class DebtPair {
        private String id;
        private String fromPlayerId;
        private String fromPlayerName;
        private String toPlayerId;
        private String toPlayerName;
        private BigDecimal amount;
        private SettlementStatus status;
        private LocalDateTime settlementDate;

        public DebtPair() {}

        public DebtPair(String id, String fromPlayerId, String fromPlayerName, String toPlayerId, String toPlayerName, BigDecimal amount, SettlementStatus status) {
            this.id = id;
            this.fromPlayerId = fromPlayerId;
            this.fromPlayerName = fromPlayerName;
            this.toPlayerId = toPlayerId;
            this.toPlayerName = toPlayerName;
            this.amount = amount;
            this.status = status;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getFromPlayerId() { return fromPlayerId; }
        public void setFromPlayerId(String fromPlayerId) { this.fromPlayerId = fromPlayerId; }

        public String getFromPlayerName() { return fromPlayerName; }
        public void setFromPlayerName(String fromPlayerName) { this.fromPlayerName = fromPlayerName; }

        public String getToPlayerId() { return toPlayerId; }
        public void setToPlayerId(String toPlayerId) { this.toPlayerId = toPlayerId; }

        public String getToPlayerName() { return toPlayerName; }
        public void setToPlayerName(String toPlayerName) { this.toPlayerName = toPlayerName; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public SettlementStatus getStatus() { return status; }
        public void setStatus(SettlementStatus status) { this.status = status; }

        public LocalDateTime getSettlementDate() { return settlementDate; }
        public void setSettlementDate(LocalDateTime settlementDate) { this.settlementDate = settlementDate; }
    }

    public static class SimplifiedDebt {
        private String fromPlayerId;
        private String fromPlayerName;
        private String toPlayerId;
        private String toPlayerName;
        private BigDecimal amount;

        public SimplifiedDebt() {}

        public SimplifiedDebt(String fromPlayerId, String fromPlayerName, String toPlayerId, String toPlayerName, BigDecimal amount) {
            this.fromPlayerId = fromPlayerId;
            this.fromPlayerName = fromPlayerName;
            this.toPlayerId = toPlayerId;
            this.toPlayerName = toPlayerName;
            this.amount = amount;
        }

        public String getFromPlayerId() { return fromPlayerId; }
        public void setFromPlayerId(String fromPlayerId) { this.fromPlayerId = fromPlayerId; }

        public String getFromPlayerName() { return fromPlayerName; }
        public void setFromPlayerName(String fromPlayerName) { this.fromPlayerName = fromPlayerName; }

        public String getToPlayerId() { return toPlayerId; }
        public void setToPlayerId(String toPlayerId) { this.toPlayerId = toPlayerId; }

        public String getToPlayerName() { return toPlayerName; }
        public void setToPlayerName(String toPlayerName) { this.toPlayerName = toPlayerName; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class PlayerNetBalance {
        private String playerId;
        private String playerName;
        private BigDecimal netBalance; // positive = owed to player, negative = player owes
        private String statusText; // "Owes ₹..." or "Gets back ₹..."

        public PlayerNetBalance() {}

        public PlayerNetBalance(String playerId, String playerName, BigDecimal netBalance) {
            this.playerId = playerId;
            this.playerName = playerName;
            this.netBalance = netBalance;
            if (netBalance.compareTo(BigDecimal.ZERO) > 0) {
                this.statusText = "Receives ₹" + netBalance.toPlainString();
            } else if (netBalance.compareTo(BigDecimal.ZERO) < 0) {
                this.statusText = "Owes ₹" + netBalance.abs().toPlainString();
            } else {
                this.statusText = "Settled (₹0.00)";
            }
        }

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }

        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }

        public BigDecimal getNetBalance() { return netBalance; }
        public void setNetBalance(BigDecimal netBalance) { this.netBalance = netBalance; }

        public String getStatusText() { return statusText; }
        public void setStatusText(String statusText) { this.statusText = statusText; }
    }

    public static class ResolveSettlementRequest {
        @NotBlank(message = "From player ID is required")
        private String fromPlayerId;

        @NotBlank(message = "To player ID is required")
        private String toPlayerId;

        @NotNull(message = "Amount is required")
        @DecimalMin("1.00")
        private BigDecimal amount;

        private PaymentMethod paymentMethod = PaymentMethod.UPI;
        private String transactionReference;
        private String notes;

        public ResolveSettlementRequest() {}

        public String getFromPlayerId() { return fromPlayerId; }
        public void setFromPlayerId(String fromPlayerId) { this.fromPlayerId = fromPlayerId; }

        public String getToPlayerId() { return toPlayerId; }
        public void setToPlayerId(String toPlayerId) { this.toPlayerId = toPlayerId; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

        public String getTransactionReference() { return transactionReference; }
        public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}

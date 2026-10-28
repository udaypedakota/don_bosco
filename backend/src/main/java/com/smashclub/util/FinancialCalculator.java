package com.smashclub.util;

import com.smashclub.exception.FinancialReconciliationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public class FinancialCalculator {

    public static final int MONEY_SCALE = 2;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    /**
     * Splits an expense equally among participants with exact reconciliation of remainders.
     * For example, ₹100.00 split among 3:
     * base = 33.33, remainder = 0.01.
     * First participant gets 33.34, next two get 33.33. Total sum = 100.00 exactly.
     *
     * @param totalAmount Total expense amount
     * @param participantCount Number of participants
     * @return List of shares whose sum == totalAmount
     */
    public static List<BigDecimal> splitEqually(BigDecimal totalAmount, int participantCount) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new FinancialReconciliationException("Total amount cannot be negative or null");
        }
        if (participantCount <= 0) {
            throw new FinancialReconciliationException("Participant count must be at least 1");
        }

        BigDecimal scaledTotal = totalAmount.setScale(MONEY_SCALE, ROUNDING_MODE);
        if (scaledTotal.compareTo(BigDecimal.ZERO) == 0) {
            List<BigDecimal> zeros = new ArrayList<>();
            for (int i = 0; i < participantCount; i++) {
                zeros.add(BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE));
            }
            return zeros;
        }

        BigDecimal count = BigDecimal.valueOf(participantCount);
        BigDecimal baseShare = scaledTotal.divide(count, MONEY_SCALE, RoundingMode.DOWN);
        BigDecimal allocatedSoFar = baseShare.multiply(count);
        BigDecimal remainder = scaledTotal.subtract(allocatedSoFar);

        // Remainder in cents (0.01 units)
        int remainderCents = remainder.movePointRight(MONEY_SCALE).intValueExact();

        List<BigDecimal> shares = new ArrayList<>(participantCount);
        BigDecimal oneCent = new BigDecimal("0.01");

        for (int i = 0; i < participantCount; i++) {
            if (i < remainderCents) {
                shares.add(baseShare.add(oneCent).setScale(MONEY_SCALE, ROUNDING_MODE));
            } else {
                shares.add(baseShare.setScale(MONEY_SCALE, ROUNDING_MODE));
            }
        }

        // Verification check
        reconcileSum(shares, scaledTotal);
        return shares;
    }

    /**
     * Validates and standardizes custom fixed allocations.
     * Reconciles that the sum of custom amounts equals the totalAmount.
     */
    public static List<BigDecimal> validateCustomFixed(BigDecimal totalAmount, List<BigDecimal> allocations) {
        if (totalAmount == null || allocations == null || allocations.isEmpty()) {
            throw new FinancialReconciliationException("Total amount and allocations must be provided");
        }

        BigDecimal scaledTotal = totalAmount.setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal sum = BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE);
        List<BigDecimal> validated = new ArrayList<>();

        for (BigDecimal alloc : allocations) {
            if (alloc == null || alloc.compareTo(BigDecimal.ZERO) < 0) {
                throw new FinancialReconciliationException("Allocation shares cannot be negative");
            }
            BigDecimal scaled = alloc.setScale(MONEY_SCALE, ROUNDING_MODE);
            validated.add(scaled);
            sum = sum.add(scaled);
        }

        if (sum.compareTo(scaledTotal) != 0) {
            throw new FinancialReconciliationException(String.format(
                    "Custom fixed shares sum (₹%s) does not reconcile to total amount (₹%s). Difference: ₹%s",
                    sum.toPlainString(), scaledTotal.toPlainString(), scaledTotal.subtract(sum).abs().toPlainString()));
        }

        return validated;
    }

    /**
     * Splits by custom percentage with exact penny reconciliation.
     * Percentages must sum to 100.00%.
     */
    public static List<BigDecimal> splitByPercentage(BigDecimal totalAmount, List<BigDecimal> percentages) {
        if (totalAmount == null || percentages == null || percentages.isEmpty()) {
            throw new FinancialReconciliationException("Total amount and percentages must be provided");
        }

        BigDecimal scaledTotal = totalAmount.setScale(MONEY_SCALE, ROUNDING_MODE);
        BigDecimal totalPercentage = BigDecimal.ZERO;

        for (BigDecimal pct : percentages) {
            if (pct == null || pct.compareTo(BigDecimal.ZERO) < 0) {
                throw new FinancialReconciliationException("Percentage shares cannot be negative");
            }
            totalPercentage = totalPercentage.add(pct);
        }

        BigDecimal hundred = new BigDecimal("100.00");
        if (totalPercentage.setScale(2, ROUNDING_MODE).compareTo(hundred) != 0) {
            throw new FinancialReconciliationException(String.format(
                    "Percentages must sum to 100.00%%, but summed to %s%%", totalPercentage.toPlainString()));
        }

        List<BigDecimal> shares = new ArrayList<>(percentages.size());
        BigDecimal allocatedSum = BigDecimal.ZERO;

        for (int i = 0; i < percentages.size(); i++) {
            BigDecimal pct = percentages.get(i);
            BigDecimal share = scaledTotal.multiply(pct).divide(hundred, MONEY_SCALE, ROUNDING_MODE);
            shares.add(share);
            allocatedSum = allocatedSum.add(share);
        }

        // Adjust penny difference on the largest allocation to maintain exact total
        BigDecimal diff = scaledTotal.subtract(allocatedSum);
        if (diff.compareTo(BigDecimal.ZERO) != 0) {
            int maxIdx = 0;
            BigDecimal maxShare = shares.get(0);
            for (int i = 1; i < shares.size(); i++) {
                if (shares.get(i).compareTo(maxShare) > 0) {
                    maxShare = shares.get(i);
                    maxIdx = i;
                }
            }
            shares.set(maxIdx, shares.get(maxIdx).add(diff).setScale(MONEY_SCALE, ROUNDING_MODE));
        }

        reconcileSum(shares, scaledTotal);
        return shares;
    }

    /**
     * Verifies that the sum of shares strictly matches the target total.
     */
    public static void reconcileSum(List<BigDecimal> shares, BigDecimal target) {
        BigDecimal sum = BigDecimal.ZERO.setScale(MONEY_SCALE, ROUNDING_MODE);
        for (BigDecimal share : shares) {
            sum = sum.add(share);
        }
        if (sum.compareTo(target.setScale(MONEY_SCALE, ROUNDING_MODE)) != 0) {
            throw new FinancialReconciliationException(String.format(
                    "Reconciliation check failed: Sum is ₹%s but expected ₹%s",
                    sum.toPlainString(), target.toPlainString()));
        }
    }

    /**
     * Debt Simplification (Minimizing Cash Flow):
     * Given net balances of each player (positive = owed money, negative = owes money),
     * computes the minimal settlements: who owes whom.
     *
     * @param netBalances Map of playerId -> net balance
     * @return List of DebtSettlement transfers
     */
    public static List<DebtTransfer> simplifyDebts(Map<String, BigDecimal> netBalances) {
        List<DebtTransfer> transfers = new ArrayList<>();
        if (netBalances == null || netBalances.isEmpty()) {
            return transfers;
        }

        // Separate debtors (owe money, negative) and creditors (owed money, positive)
        PriorityQueue<PlayerBalance> debtors = new PriorityQueue<>(Comparator.comparing(pb -> pb.balance)); // ascending (most negative first)
        PriorityQueue<PlayerBalance> creditors = new PriorityQueue<>((a, b) -> b.balance.compareTo(a.balance)); // descending (most positive first)

        for (Map.Entry<String, BigDecimal> entry : netBalances.entrySet()) {
            BigDecimal bal = entry.getValue().setScale(MONEY_SCALE, ROUNDING_MODE);
            if (bal.compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(new PlayerBalance(entry.getKey(), bal));
            } else if (bal.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(new PlayerBalance(entry.getKey(), bal));
            }
        }

        BigDecimal threshold = new BigDecimal("0.01");

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            PlayerBalance debtor = debtors.poll();
            PlayerBalance creditor = creditors.poll();

            BigDecimal debtAmount = debtor.balance.abs();
            BigDecimal creditAmount = creditor.balance;

            BigDecimal settleAmount = debtAmount.min(creditAmount);

            transfers.add(new DebtTransfer(debtor.playerId, creditor.playerId, settleAmount));

            debtor.balance = debtor.balance.add(settleAmount);
            creditor.balance = creditor.balance.subtract(settleAmount);

            if (debtor.balance.abs().compareTo(threshold) >= 0) {
                debtors.add(debtor);
            }
            if (creditor.balance.compareTo(threshold) >= 0) {
                creditors.add(creditor);
            }
        }

        return transfers;
    }

    public static class PlayerBalance {
        public String playerId;
        public BigDecimal balance;

        public PlayerBalance(String playerId, BigDecimal balance) {
            this.playerId = playerId;
            this.balance = balance;
        }
    }

    public static class DebtTransfer {
        public String fromPlayerId;
        public String toPlayerId;
        public BigDecimal amount;

        public DebtTransfer(String fromPlayerId, String toPlayerId, BigDecimal amount) {
            this.fromPlayerId = fromPlayerId;
            this.toPlayerId = toPlayerId;
            this.amount = amount;
        }
    }
}

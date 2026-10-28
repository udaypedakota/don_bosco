package com.smashclub;

import com.smashclub.exception.FinancialReconciliationException;
import com.smashclub.util.FinancialCalculator;
import com.smashclub.util.FinancialCalculator.DebtTransfer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class FinancialCalculatorTest {

    @Test
    @DisplayName("Should split ₹840 equally among 6 participants into exact ₹140.00 each")
    void testSplitEquallyExactPromptExample() {
        BigDecimal total = new BigDecimal("840.00");
        int participants = 6;

        List<BigDecimal> shares = FinancialCalculator.splitEqually(total, participants);

        assertEquals(6, shares.size());
        for (BigDecimal share : shares) {
            assertEquals(new BigDecimal("140.00"), share);
        }

        BigDecimal sum = shares.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(total, sum);
    }

    @Test
    @DisplayName("Should handle remainder penny reconciliation so sum always equals total (100 / 3)")
    void testSplitEquallyWithPennyRemainder() {
        BigDecimal total = new BigDecimal("100.00");
        int participants = 3;

        List<BigDecimal> shares = FinancialCalculator.splitEqually(total, participants);

        assertEquals(3, shares.size());
        assertEquals(new BigDecimal("33.34"), shares.get(0));
        assertEquals(new BigDecimal("33.33"), shares.get(1));
        assertEquals(new BigDecimal("33.33"), shares.get(2));

        BigDecimal sum = shares.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(total, sum);
    }

    @Test
    @DisplayName("Should validate custom fixed allocations that equal the total amount")
    void testValidateCustomFixedSuccess() {
        BigDecimal total = new BigDecimal("500.00");
        List<BigDecimal> allocations = List.of(
                new BigDecimal("200.00"),
                new BigDecimal("150.00"),
                new BigDecimal("150.00")
        );

        List<BigDecimal> validated = FinancialCalculator.validateCustomFixed(total, allocations);
        assertEquals(3, validated.size());
        BigDecimal sum = validated.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(total, sum);
    }

    @Test
    @DisplayName("Should reject custom fixed allocations when sum does not equal total amount")
    void testValidateCustomFixedMismatchThrows() {
        BigDecimal total = new BigDecimal("500.00");
        List<BigDecimal> allocations = List.of(
                new BigDecimal("200.00"),
                new BigDecimal("150.00"),
                new BigDecimal("100.00") // Sum = 450, missing 50
        );

        assertThrows(FinancialReconciliationException.class, () ->
                FinancialCalculator.validateCustomFixed(total, allocations)
        );
    }

    @Test
    @DisplayName("Should split by percentage and reconcile penny difference")
    void testSplitByPercentage() {
        BigDecimal total = new BigDecimal("1000.00");
        List<BigDecimal> percentages = List.of(
                new BigDecimal("50.00"),
                new BigDecimal("30.00"),
                new BigDecimal("20.00")
        );

        List<BigDecimal> shares = FinancialCalculator.splitByPercentage(total, percentages);
        assertEquals(3, shares.size());
        assertEquals(new BigDecimal("500.00"), shares.get(0));
        assertEquals(new BigDecimal("300.00"), shares.get(1));
        assertEquals(new BigDecimal("200.00"), shares.get(2));

        BigDecimal sum = shares.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(total, sum);
    }

    @Test
    @DisplayName("Should simplify debts across multiple participants (Minimizing Cash Flow)")
    void testSimplifyDebts() {
        // Player A owes ₹140, Player B owes ₹140, Organizer O is owed ₹280
        Map<String, BigDecimal> balances = new HashMap<>();
        balances.put("P_A", new BigDecimal("-140.00"));
        balances.put("P_B", new BigDecimal("-140.00"));
        balances.put("P_ORG", new BigDecimal("280.00"));

        List<DebtTransfer> transfers = FinancialCalculator.simplifyDebts(balances);

        assertEquals(2, transfers.size());
        BigDecimal totalTransferred = transfers.stream()
                .map(t -> t.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(new BigDecimal("280.00"), totalTransferred);
        for (DebtTransfer t : transfers) {
            assertEquals("P_ORG", t.toPlayerId);
            assertEquals(new BigDecimal("140.00"), t.amount);
        }
    }
}

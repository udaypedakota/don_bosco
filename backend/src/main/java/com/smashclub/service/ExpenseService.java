package com.smashclub.service;

import com.smashclub.dto.ExpenseSplitDTO.*;
import com.smashclub.exception.BadRequestException;
import com.smashclub.exception.FinancialReconciliationException;
import com.smashclub.exception.ResourceNotFoundException;
import com.smashclub.model.*;
import com.smashclub.repository.*;
import com.smashclub.util.FinancialCalculator;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final GameRepository gameRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseAllocationRepository expenseAllocationRepository;
    private final PlayerRepository playerRepository;
    private final AuditLogRepository auditLogRepository;

    public ExpenseService(GameRepository gameRepository,
                          GameParticipantRepository gameParticipantRepository,
                          ExpenseRepository expenseRepository,
                          ExpenseAllocationRepository expenseAllocationRepository,
                          PlayerRepository playerRepository,
                          AuditLogRepository auditLogRepository) {
        this.gameRepository = gameRepository;
        this.gameParticipantRepository = gameParticipantRepository;
        this.expenseRepository = expenseRepository;
        this.expenseAllocationRepository = expenseAllocationRepository;
        this.playerRepository = playerRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Preview calculation of expense split for a game without modifying database.
     * Shows before & after comparison, rounding adjustment, and reconciliation check.
     */
    public SplitAllocationPreview previewSplit(String gameId, SplitType splitType, List<PlayerShareRequest> customAllocations) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with ID: " + gameId));

        List<GameParticipant> participants = gameParticipantRepository.findByGameId(gameId);
        List<GameParticipant> attended = participants.stream()
                .filter(GameParticipant::isAttended)
                .collect(Collectors.toList());

        if (attended.isEmpty()) {
            throw new BadRequestException("No attended participants selected for this game.");
        }

        BigDecimal totalExpense = game.getTotalCost();
        SplitAllocationPreview preview = new SplitAllocationPreview();
        preview.setGameId(gameId);
        preview.setTotalExpense(totalExpense);
        preview.setSplitType(splitType);
        preview.setParticipantCount(attended.size());

        List<AllocatedShareDetail> details = new ArrayList<>();
        BigDecimal sumAllocated = BigDecimal.ZERO;

        if (splitType == SplitType.EQUAL) {
            List<BigDecimal> shares = FinancialCalculator.splitEqually(totalExpense, attended.size());
            for (int i = 0; i < attended.size(); i++) {
                GameParticipant gp = attended.get(i);
                BigDecimal share = shares.get(i);
                BigDecimal pct = share.divide(totalExpense, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

                AllocatedShareDetail detail = new AllocatedShareDetail(gp.getPlayerId(), gp.getPlayerName(), share, pct);
                detail.setPreviousShareAmount(gp.getShareAmount());
                detail.setDifference(share.subtract(gp.getShareAmount() != null ? gp.getShareAmount() : BigDecimal.ZERO));
                details.add(detail);
                sumAllocated = sumAllocated.add(share);
            }
        } else if (splitType == SplitType.CUSTOM_FIXED) {
            Map<String, BigDecimal> fixedMap = customAllocations != null ? customAllocations.stream()
                    .collect(Collectors.toMap(PlayerShareRequest::getPlayerId, PlayerShareRequest::getCustomFixedAmount, (a, b) -> a))
                    : Collections.emptyMap();

            List<BigDecimal> amounts = new ArrayList<>();
            for (GameParticipant gp : attended) {
                BigDecimal amt = fixedMap.getOrDefault(gp.getPlayerId(), BigDecimal.ZERO);
                amounts.add(amt);
            }

            List<BigDecimal> validated = FinancialCalculator.validateCustomFixed(totalExpense, amounts);
            for (int i = 0; i < attended.size(); i++) {
                GameParticipant gp = attended.get(i);
                BigDecimal share = validated.get(i);
                BigDecimal pct = totalExpense.compareTo(BigDecimal.ZERO) > 0
                        ? share.divide(totalExpense, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                        : BigDecimal.ZERO;

                AllocatedShareDetail detail = new AllocatedShareDetail(gp.getPlayerId(), gp.getPlayerName(), share, pct);
                detail.setPreviousShareAmount(gp.getShareAmount());
                detail.setDifference(share.subtract(gp.getShareAmount() != null ? gp.getShareAmount() : BigDecimal.ZERO));
                details.add(detail);
                sumAllocated = sumAllocated.add(share);
            }
        } else if (splitType == SplitType.CUSTOM_PERCENTAGE) {
            Map<String, BigDecimal> pctMap = customAllocations != null ? customAllocations.stream()
                    .collect(Collectors.toMap(PlayerShareRequest::getPlayerId, PlayerShareRequest::getCustomPercentage, (a, b) -> a))
                    : Collections.emptyMap();

            List<BigDecimal> percentages = new ArrayList<>();
            for (GameParticipant gp : attended) {
                BigDecimal p = pctMap.getOrDefault(gp.getPlayerId(), BigDecimal.ZERO);
                percentages.add(p);
            }

            List<BigDecimal> shares = FinancialCalculator.splitByPercentage(totalExpense, percentages);
            for (int i = 0; i < attended.size(); i++) {
                GameParticipant gp = attended.get(i);
                BigDecimal share = shares.get(i);
                BigDecimal pct = percentages.get(i);

                AllocatedShareDetail detail = new AllocatedShareDetail(gp.getPlayerId(), gp.getPlayerName(), share, pct);
                detail.setPreviousShareAmount(gp.getShareAmount());
                detail.setDifference(share.subtract(gp.getShareAmount() != null ? gp.getShareAmount() : BigDecimal.ZERO));
                details.add(detail);
                sumAllocated = sumAllocated.add(share);
            }
        }

        preview.setShares(details);
        preview.setTotalAllocated(sumAllocated);
        preview.setRoundingAdjustment(totalExpense.subtract(sumAllocated));
        preview.setReconciled(totalExpense.compareTo(sumAllocated) == 0);

        return preview;
    }

    /**
     * Confirms and applies financial split allocations to database and updates player summaries.
     */
    public SplitAllocationPreview confirmSplit(ConfirmSplitRequest request, String performedBy) {
        SplitAllocationPreview preview = previewSplit(request.getGameId(), request.getSplitType(), request.getAllocations());

        if (!preview.isReconciled()) {
            throw new FinancialReconciliationException("Cannot apply allocations: Sum of shares does not reconcile to total game cost.");
        }

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with ID: " + request.getGameId()));

        // Create or update parent Expense document
        List<Expense> existingExpenses = expenseRepository.findByGameId(game.getId());
        Expense expense;
        if (existingExpenses.isEmpty()) {
            expense = new Expense(game.getId(), "Game Session Cost: " + game.getTitle(), "GAME_SESSION",
                    game.getTotalCost(), game.getOrganizerPlayerId(), game.getOrganizerName(), request.getSplitType());
        } else {
            expense = existingExpenses.get(0);
            expense.setTotalAmount(game.getTotalCost());
            expense.setSplitType(request.getSplitType());
        }
        expense.setParticipantCount(preview.getParticipantCount());
        expense.setReconciled(true);
        Expense savedExpense = expenseRepository.save(expense);

        // Update Game state
        game.setSplitType(request.getSplitType());
        game.setStatus("COMPLETED");
        game.setFinancialConfirmed(true);
        gameRepository.save(game);

        // Update allocations and participant records
        for (AllocatedShareDetail detail : preview.getShares()) {
            GameParticipant gp = gameParticipantRepository.findByGameIdAndPlayerId(game.getId(), detail.getPlayerId())
                    .orElse(new GameParticipant(game.getId(), detail.getPlayerId(), detail.getPlayerName()));

            gp.setShareAmount(detail.getShareAmount());
            gp.setCustomFixedAmount(detail.getShareAmount());
            gp.setCustomPercentage(detail.getPercentage());

            // Check if player is organizer (e.g. they paid the whole bill upfront)
            boolean isOrganizer = detail.getPlayerId().equals(game.getOrganizerPlayerId());

            ExpenseAllocation alloc = expenseAllocationRepository.findByExpenseIdAndPlayerId(savedExpense.getId(), detail.getPlayerId())
                    .orElse(new ExpenseAllocation(savedExpense.getId(), game.getId(), detail.getPlayerId(), detail.getPlayerName(), detail.getShareAmount()));

            alloc.setAllocatedAmount(detail.getShareAmount());

            if (isOrganizer && alloc.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
                // Organizer self-covers their own share
                alloc.setPaidAmount(detail.getShareAmount());
                gp.setPaidAmount(detail.getShareAmount());
                gp.setPaymentStatus(PaymentStatus.PAID);
            }

            alloc.updateBalance();
            gp.setPaymentStatus(alloc.getStatus());

            expenseAllocationRepository.save(alloc);
            gameParticipantRepository.save(gp);

            // Recompute player financial summary
            recalculatePlayerFinancialSummary(detail.getPlayerId());
        }

        auditLogRepository.save(new AuditLog("SPLIT_CONFIRMED", "Game", game.getId(), performedBy,
                "Confirmed " + request.getSplitType() + " expense split of ₹" + game.getTotalCost() + " among " + preview.getParticipantCount() + " players"));

        return preview;
    }

    public void recalculatePlayerFinancialSummary(String playerId) {
        Player player = playerRepository.findById(playerId).orElse(null);
        if (player == null) return;

        List<ExpenseAllocation> allocations = expenseAllocationRepository.findByPlayerId(playerId);
        BigDecimal totalShare = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;

        for (ExpenseAllocation a : allocations) {
            if (a.getAllocatedAmount() != null) totalShare = totalShare.add(a.getAllocatedAmount());
            if (a.getPaidAmount() != null) totalPaid = totalPaid.add(a.getPaidAmount());
        }

        List<GameParticipant> gps = gameParticipantRepository.findByPlayerId(playerId);
        long gamesAttended = gps.stream().filter(GameParticipant::isAttended).count();

        player.setTotalGamesPlayed((int) gamesAttended);
        player.setTotalExpenseShare(totalShare);
        player.setTotalPaid(totalPaid);
        player.setOutstandingBalance(totalShare.subtract(totalPaid).max(BigDecimal.ZERO));

        playerRepository.save(player);
    }
}

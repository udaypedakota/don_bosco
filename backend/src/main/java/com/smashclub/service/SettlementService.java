package com.smashclub.service;

import com.smashclub.dto.PaymentDTO.RecordPaymentRequest;
import com.smashclub.dto.SettlementDTO.*;
import com.smashclub.exception.BadRequestException;
import com.smashclub.model.*;
import com.smashclub.repository.*;
import com.smashclub.util.FinancialCalculator;
import com.smashclub.util.FinancialCalculator.DebtTransfer;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SettlementService {

    private final PlayerRepository playerRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseAllocationRepository expenseAllocationRepository;
    private final PaymentRepository paymentRepository;
    private final SettlementRepository settlementRepository;
    private final PaymentService paymentService;
    private final AuditLogRepository auditLogRepository;

    public SettlementService(PlayerRepository playerRepository,
                             ExpenseRepository expenseRepository,
                             ExpenseAllocationRepository expenseAllocationRepository,
                             PaymentRepository paymentRepository,
                             SettlementRepository settlementRepository,
                             PaymentService paymentService,
                             AuditLogRepository auditLogRepository) {
        this.playerRepository = playerRepository;
        this.expenseRepository = expenseRepository;
        this.expenseAllocationRepository = expenseAllocationRepository;
        this.paymentRepository = paymentRepository;
        this.settlementRepository = settlementRepository;
        this.paymentService = paymentService;
        this.auditLogRepository = auditLogRepository;
    }

    public SettlementSummaryResponse getSettlementSummary() {
        List<Player> allPlayers = playerRepository.findAll();
        Map<String, String> playerNameMap = allPlayers.stream()
                .collect(Collectors.toMap(Player::getId, Player::getName));

        // 1. Calculate how much each player paid upfront (Organizers / Advances)
        // Expenses where paidByPlayerId = P
        List<Expense> expenses = expenseRepository.findAll();
        Map<String, BigDecimal> totalPaidUpfront = new HashMap<>();
        BigDecimal totalGroupExpenses = BigDecimal.ZERO;

        for (Expense exp : expenses) {
            if ("RECORDED".equalsIgnoreCase(exp.getStatus())) {
                totalGroupExpenses = totalGroupExpenses.add(exp.getTotalAmount());
                if (exp.getPaidByPlayerId() != null) {
                    totalPaidUpfront.merge(exp.getPaidByPlayerId(), exp.getTotalAmount(), BigDecimal::add);
                }
            }
        }

        // 2. Calculate how much each player was allocated (their personal share)
        List<ExpenseAllocation> allocations = expenseAllocationRepository.findAll();
        Map<String, BigDecimal> totalAllocatedShare = new HashMap<>();
        for (ExpenseAllocation alloc : allocations) {
            totalAllocatedShare.merge(alloc.getPlayerId(), alloc.getAllocatedAmount(), BigDecimal::add);
        }

        // 3. Direct peer-to-peer / reimbursement payments already completed
        List<Payment> payments = paymentRepository.findAll();
        BigDecimal totalPaymentsCollected = BigDecimal.ZERO;
        Map<String, BigDecimal> reimbursementsReceived = new HashMap<>(); // payee received money
        Map<String, BigDecimal> settlementsPaid = new HashMap<>(); // payer sent money

        for (Payment p : payments) {
            if (p.getStatus() == PaymentStatus.PAID) {
                totalPaymentsCollected = totalPaymentsCollected.add(p.getAmount());
                if (p.getPayeePlayerId() != null) {
                    reimbursementsReceived.merge(p.getPayeePlayerId(), p.getAmount(), BigDecimal::add);
                }
                settlementsPaid.merge(p.getPayerPlayerId(), p.getAmount(), BigDecimal::add);
            }
        }

        // 4. Calculate Net Balance for each player:
        // Net Balance = (Upfront Paid + Settlements Paid) - (Allocated Share + Reimbursements Received)
        // Positive Net Balance => The club / other players OWE this person money (e.g. Organizer)
        // Negative Net Balance => This person OWES money to the group
        Map<String, BigDecimal> netBalances = new HashMap<>();
        List<PlayerNetBalance> netBalanceList = new ArrayList<>();
        BigDecimal totalOutstanding = BigDecimal.ZERO;

        for (Player p : allPlayers) {
            BigDecimal upfront = totalPaidUpfront.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal paidIn = settlementsPaid.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal share = totalAllocatedShare.getOrDefault(p.getId(), BigDecimal.ZERO);
            BigDecimal received = reimbursementsReceived.getOrDefault(p.getId(), BigDecimal.ZERO);

            // net = (upfront + paidIn) - (share + received)
            BigDecimal net = upfront.add(paidIn).subtract(share).subtract(received);
            netBalances.put(p.getId(), net);

            netBalanceList.add(new PlayerNetBalance(p.getId(), p.getName(), net));

            if (net.compareTo(BigDecimal.ZERO) < 0) {
                totalOutstanding = totalOutstanding.add(net.abs());
            }
        }

        // 5. Compute simplified debts ("Who owes whom")
        List<DebtTransfer> transfers = FinancialCalculator.simplifyDebts(netBalances);
        List<SimplifiedDebt> simplifiedDebts = new ArrayList<>();
        for (DebtTransfer t : transfers) {
            String fromName = playerNameMap.getOrDefault(t.fromPlayerId, "Unknown");
            String toName = playerNameMap.getOrDefault(t.toPlayerId, "Organizer");
            simplifiedDebts.add(new SimplifiedDebt(t.fromPlayerId, fromName, t.toPlayerId, toName, t.amount));
        }

        // 6. Direct debts from allocations
        List<DebtPair> directDebts = new ArrayList<>();
        for (ExpenseAllocation alloc : allocations) {
            if (alloc.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
                // Find who paid for this expense
                Expense exp = expenseRepository.findById(alloc.getExpenseId()).orElse(null);
                String payeeId = exp != null ? exp.getPaidByPlayerId() : null;
                String payeeName = exp != null ? exp.getPaidByPlayerName() : "Organizer";

                if (payeeId != null && !payeeId.equals(alloc.getPlayerId())) {
                    directDebts.add(new DebtPair(
                            alloc.getId(),
                            alloc.getPlayerId(),
                            alloc.getPlayerName(),
                            payeeId,
                            payeeName,
                            alloc.getBalanceAmount(),
                            SettlementStatus.UNSETTLED
                    ));
                }
            }
        }

        SettlementSummaryResponse res = new SettlementSummaryResponse();
        res.setTotalGroupExpenses(totalGroupExpenses);
        res.setTotalPaymentsCollected(totalPaymentsCollected);
        res.setTotalOutstandingBalance(totalOutstanding);
        res.setTotalUnsettledDebts(simplifiedDebts.size());
        res.setNetBalances(netBalanceList);
        res.setSimplifiedDebts(simplifiedDebts);
        res.setDirectDebts(directDebts);

        return res;
    }

    public void resolveSettlement(ResolveSettlementRequest request, String performedBy) {
        Player fromPlayer = playerRepository.findById(request.getFromPlayerId())
                .orElseThrow(() -> new BadRequestException("From player not found with ID: " + request.getFromPlayerId()));

        Player toPlayer = playerRepository.findById(request.getToPlayerId())
                .orElseThrow(() -> new BadRequestException("To player not found with ID: " + request.getToPlayerId()));

        // Record official settlement payment
        RecordPaymentRequest pr = new RecordPaymentRequest();
        pr.setPayerPlayerId(fromPlayer.getId());
        pr.setPayeePlayerId(toPlayer.getId());
        pr.setAmount(request.getAmount());
        pr.setPaymentMethod(request.getPaymentMethod());
        pr.setTransactionReference(request.getTransactionReference());
        pr.setPaymentDate(LocalDateTime.now());
        pr.setNotes("Settlement reimbursement to " + toPlayer.getName() + (request.getNotes() != null ? " - " + request.getNotes() : ""));

        paymentService.recordPayment(pr, performedBy, true);

        // Record settlement entity
        Settlement settlement = new Settlement(fromPlayer.getId(), fromPlayer.getName(), toPlayer.getId(), toPlayer.getName(), request.getAmount());
        settlement.setStatus(SettlementStatus.SETTLED);
        settlement.setSettlementDate(LocalDateTime.now());
        settlement.setNotes(request.getNotes());
        settlementRepository.save(settlement);

        auditLogRepository.save(new AuditLog("SETTLEMENT_RESOLVED", "Settlement", settlement.getId(), performedBy,
                "Settled ₹" + request.getAmount() + " from " + fromPlayer.getName() + " to " + toPlayer.getName()));
    }
}

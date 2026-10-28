package com.smashclub.service;

import com.smashclub.dto.PaymentDTO.*;
import com.smashclub.exception.BadRequestException;
import com.smashclub.exception.ResourceNotFoundException;
import com.smashclub.model.*;
import com.smashclub.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PlayerRepository playerRepository;
    private final ExpenseAllocationRepository expenseAllocationRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final ExpenseService expenseService;
    private final AuditLogRepository auditLogRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          PlayerRepository playerRepository,
                          ExpenseAllocationRepository expenseAllocationRepository,
                          GameParticipantRepository gameParticipantRepository,
                          ExpenseService expenseService,
                          AuditLogRepository auditLogRepository) {
        this.paymentRepository = paymentRepository;
        this.playerRepository = playerRepository;
        this.expenseAllocationRepository = expenseAllocationRepository;
        this.gameParticipantRepository = gameParticipantRepository;
        this.expenseService = expenseService;
        this.auditLogRepository = auditLogRepository;
    }

    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsByPayer(String payerPlayerId) {
        return paymentRepository.findByPayerPlayerIdOrderByPaymentDateDesc(payerPlayerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getPaymentsByGame(String gameId) {
        return paymentRepository.findByGameId(gameId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Record a payment with duplicate checking, allocation balance update, and audit log.
     */
    public synchronized PaymentResponse recordPayment(RecordPaymentRequest request, String performedBy, boolean isAdmin) {
        // Prevent duplicate payment transaction reference (e.g. UPI UTR)
        if (request.getTransactionReference() != null && !request.getTransactionReference().isBlank()) {
            String tr = request.getTransactionReference().trim();
            if (paymentRepository.existsByTransactionReference(tr)) {
                throw new BadRequestException("A payment with transaction reference (UTR) '" + tr + "' is already recorded.");
            }
        }

        Player payer = playerRepository.findById(request.getPayerPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Payer player not found with ID: " + request.getPayerPlayerId()));

        Player payee = null;
        if (request.getPayeePlayerId() != null) {
            payee = playerRepository.findById(request.getPayeePlayerId()).orElse(null);
        }

        String refNum = "PAY-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();

        Payment payment = new Payment();
        payment.setPaymentReferenceNumber(refNum);
        payment.setGameId(request.getGameId());
        payment.setExpenseId(request.getExpenseId());
        payment.setPayerPlayerId(payer.getId());
        payment.setPayerPlayerName(payer.getName());

        if (payee != null) {
            payment.setPayeePlayerId(payee.getId());
            payment.setPayeePlayerName(payee.getName());
        } else {
            payment.setPayeePlayerName("Club Organizer");
        }

        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionReference(request.getTransactionReference() != null ? request.getTransactionReference().trim() : null);
        payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDateTime.now());

        // If player self-records UPI, it goes to PENDING_VERIFICATION until admin verifies
        if (isAdmin) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setVerifiedByAdmin(true);
        } else {
            payment.setStatus(PaymentStatus.PENDING_VERIFICATION);
            payment.setVerifiedByAdmin(false);
        }

        payment.setNotes(request.getNotes());
        Payment saved = paymentRepository.save(payment);

        if (payment.getStatus() == PaymentStatus.PAID) {
            applyPaymentToAllocations(saved);
        }

        auditLogRepository.save(new AuditLog("PAYMENT_RECORDED", "Payment", saved.getId(), performedBy,
                "Recorded payment of ₹" + saved.getAmount() + " by " + payer.getName() + " via " + saved.getPaymentMethod()));

        return mapToResponse(saved);
    }

    public PaymentResponse verifyPayment(String paymentId, boolean approved, String performedBy) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        if (payment.getStatus() == PaymentStatus.PAID && approved) {
            return mapToResponse(payment);
        }

        if (approved) {
            payment.setStatus(PaymentStatus.PAID);
            payment.setVerifiedByAdmin(true);
            applyPaymentToAllocations(payment);
            auditLogRepository.save(new AuditLog("PAYMENT_VERIFIED", "Payment", payment.getId(), performedBy,
                    "Verified and approved payment ref " + payment.getPaymentReferenceNumber()));
        } else {
            payment.setStatus(PaymentStatus.REJECTED);
            payment.setVerifiedByAdmin(false);
            auditLogRepository.save(new AuditLog("PAYMENT_REJECTED", "Payment", payment.getId(), performedBy,
                    "Rejected payment ref " + payment.getPaymentReferenceNumber()));
        }

        Payment updated = paymentRepository.save(payment);
        return mapToResponse(updated);
    }

    private void applyPaymentToAllocations(Payment payment) {
        BigDecimal remainingPayment = payment.getAmount();

        // 1. If gameId is specified, try to apply to this game's allocations first
        if (payment.getGameId() != null) {
            List<ExpenseAllocation> gameAllocs = expenseAllocationRepository.findByGameId(payment.getGameId());
            for (ExpenseAllocation alloc : gameAllocs) {
                if (alloc.getPlayerId().equals(payment.getPayerPlayerId()) && alloc.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal toApply = remainingPayment.min(alloc.getBalanceAmount());
                    alloc.setPaidAmount(alloc.getPaidAmount().add(toApply));
                    alloc.updateBalance();
                    expenseAllocationRepository.save(alloc);

                    // Update GameParticipant
                    gameParticipantRepository.findByGameIdAndPlayerId(payment.getGameId(), payment.getPayerPlayerId())
                            .ifPresent(gp -> {
                                gp.setPaidAmount(alloc.getPaidAmount());
                                gp.setPaymentStatus(alloc.getStatus());
                                gameParticipantRepository.save(gp);
                            });

                    remainingPayment = remainingPayment.subtract(toApply);
                    if (remainingPayment.compareTo(BigDecimal.ZERO) <= 0) break;
                }
            }
        }

        // 2. If there is still payment left over or no game was specified, apply to oldest pending allocations
        if (remainingPayment.compareTo(BigDecimal.ZERO) > 0) {
            List<ExpenseAllocation> playerAllocs = expenseAllocationRepository.findByPlayerId(payment.getPayerPlayerId());
            for (ExpenseAllocation alloc : playerAllocs) {
                if (alloc.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal toApply = remainingPayment.min(alloc.getBalanceAmount());
                    alloc.setPaidAmount(alloc.getPaidAmount().add(toApply));
                    alloc.updateBalance();
                    expenseAllocationRepository.save(alloc);

                    gameParticipantRepository.findByGameIdAndPlayerId(alloc.getGameId(), payment.getPayerPlayerId())
                            .ifPresent(gp -> {
                                gp.setPaidAmount(alloc.getPaidAmount());
                                gp.setPaymentStatus(alloc.getStatus());
                                gameParticipantRepository.save(gp);
                            });

                    remainingPayment = remainingPayment.subtract(toApply);
                    if (remainingPayment.compareTo(BigDecimal.ZERO) <= 0) break;
                }
            }
        }

        expenseService.recalculatePlayerFinancialSummary(payment.getPayerPlayerId());
    }

    public PaymentResponse mapToResponse(Payment p) {
        PaymentResponse res = new PaymentResponse();
        res.setId(p.getId());
        res.setPaymentReferenceNumber(p.getPaymentReferenceNumber());
        res.setGameId(p.getGameId());
        res.setExpenseId(p.getExpenseId());
        res.setPayerPlayerId(p.getPayerPlayerId());
        res.setPayerPlayerName(p.getPayerPlayerName());
        res.setPayeePlayerId(p.getPayeePlayerId());
        res.setPayeePlayerName(p.getPayeePlayerName());
        res.setAmount(p.getAmount());
        res.setPaymentMethod(p.getPaymentMethod());
        res.setTransactionReference(p.getTransactionReference());
        res.setPaymentDate(p.getPaymentDate());
        res.setStatus(p.getStatus());
        res.setVerifiedByAdmin(p.isVerifiedByAdmin());
        res.setNotes(p.getNotes());
        res.setCreatedAt(p.getCreatedAt());
        return res;
    }
}

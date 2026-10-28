package com.smashclub;

import com.smashclub.dto.PaymentDTO.RecordPaymentRequest;
import com.smashclub.dto.PaymentDTO.PaymentResponse;
import com.smashclub.exception.BadRequestException;
import com.smashclub.model.Payment;
import com.smashclub.model.PaymentMethod;
import com.smashclub.model.PaymentStatus;
import com.smashclub.model.Player;
import com.smashclub.repository.*;
import com.smashclub.service.ExpenseService;
import com.smashclub.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceTest {

    private PaymentRepository paymentRepository;
    private PlayerRepository playerRepository;
    private ExpenseAllocationRepository expenseAllocationRepository;
    private GameParticipantRepository gameParticipantRepository;
    private ExpenseService expenseService;
    private AuditLogRepository auditLogRepository;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentRepository = mock(PaymentRepository.class);
        playerRepository = mock(PlayerRepository.class);
        expenseAllocationRepository = mock(ExpenseAllocationRepository.class);
        gameParticipantRepository = mock(GameParticipantRepository.class);
        expenseService = mock(ExpenseService.class);
        auditLogRepository = mock(AuditLogRepository.class);

        paymentService = new PaymentService(
                paymentRepository,
                playerRepository,
                expenseAllocationRepository,
                gameParticipantRepository,
                expenseService,
                auditLogRepository
        );
    }

    @Test
    @DisplayName("Should prevent duplicate payments with identical transaction reference UTR")
    void testPreventDuplicateTransactionReference() {
        String duplicateUtr = "UPI123456789012";
        when(paymentRepository.existsByTransactionReference(duplicateUtr)).thenReturn(true);

        RecordPaymentRequest request = new RecordPaymentRequest();
        request.setPayerPlayerId("player-1");
        request.setAmount(new BigDecimal("140.00"));
        request.setPaymentMethod(PaymentMethod.UPI);
        request.setTransactionReference(duplicateUtr);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                paymentService.recordPayment(request, "admin", true)
        );

        assertTrue(ex.getMessage().contains("already recorded"));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    @DisplayName("Should record payment and mark verified when recorded by admin")
    void testRecordPaymentAsAdmin() {
        Player payer = new Player("SC-002", "Ananya Sharma", "9876543211", "ananya@smashclub.in", null);
        payer.setId("p-2");
        when(playerRepository.findById("p-2")).thenReturn(Optional.of(payer));
        when(paymentRepository.existsByTransactionReference("NEW_UTR")).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        RecordPaymentRequest request = new RecordPaymentRequest();
        request.setPayerPlayerId("p-2");
        request.setAmount(new BigDecimal("140.00"));
        request.setPaymentMethod(PaymentMethod.UPI);
        request.setTransactionReference("NEW_UTR");

        PaymentResponse response = paymentService.recordPayment(request, "admin", true);

        assertNotNull(response);
        assertEquals(PaymentStatus.PAID, response.getStatus());
        assertTrue(response.isVerifiedByAdmin());
        verify(paymentRepository, times(1)).save(any(Payment.class));
    }
}

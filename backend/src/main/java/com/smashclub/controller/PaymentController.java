package com.smashclub.controller;

import com.smashclub.dto.PaymentDTO.*;
import com.smashclub.model.User;
import com.smashclub.repository.UserRepository;
import com.smashclub.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    public PaymentController(PaymentService paymentService, UserRepository userRepository) {
        this.paymentService = paymentService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByPlayer(@PathVariable String playerId) {
        return ResponseEntity.ok(paymentService.getPaymentsByPayer(playerId));
    }

    @GetMapping("/game/{gameId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByGame(@PathVariable String gameId) {
        return ResponseEntity.ok(paymentService.getPaymentsByGame(gameId));
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> recordPayment(@Valid @RequestBody RecordPaymentRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Anonymous";
        boolean isAdmin = false;
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user != null && user.getRole() != null && user.getRole().name().equals("ROLE_ADMIN")) {
                isAdmin = true;
            }
        }
        return ResponseEntity.ok(paymentService.recordPayment(request, performedBy, isAdmin));
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentResponse> verifyPayment(@PathVariable String id,
                                                         @RequestParam boolean approved,
                                                         Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(paymentService.verifyPayment(id, approved, performedBy));
    }
}

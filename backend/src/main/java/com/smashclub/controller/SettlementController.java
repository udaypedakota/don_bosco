package com.smashclub.controller;

import com.smashclub.dto.SettlementDTO.*;
import com.smashclub.model.Settlement;
import com.smashclub.repository.SettlementRepository;
import com.smashclub.service.SettlementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/settlements")
public class SettlementController {

    private final SettlementService settlementService;
    private final SettlementRepository settlementRepository;

    public SettlementController(SettlementService settlementService, SettlementRepository settlementRepository) {
        this.settlementService = settlementService;
        this.settlementRepository = settlementRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<SettlementSummaryResponse> getSettlementSummary() {
        return ResponseEntity.ok(settlementService.getSettlementSummary());
    }

    @PostMapping("/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resolveSettlement(@Valid @RequestBody ResolveSettlementRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        settlementService.resolveSettlement(request, performedBy);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<Settlement>> getSettlementHistory() {
        return ResponseEntity.ok(settlementRepository.findAllByOrderByCreatedAtDesc());
    }
}

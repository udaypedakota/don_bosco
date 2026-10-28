package com.smashclub.controller;

import com.smashclub.dto.ExpenseSplitDTO.*;
import com.smashclub.model.Expense;
import com.smashclub.model.ExpenseAllocation;
import com.smashclub.model.SplitType;
import com.smashclub.repository.ExpenseAllocationRepository;
import com.smashclub.repository.ExpenseRepository;
import com.smashclub.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final ExpenseRepository expenseRepository;
    private final ExpenseAllocationRepository expenseAllocationRepository;

    public ExpenseController(ExpenseService expenseService,
                             ExpenseRepository expenseRepository,
                             ExpenseAllocationRepository expenseAllocationRepository) {
        this.expenseService = expenseService;
        this.expenseRepository = expenseRepository;
        this.expenseAllocationRepository = expenseAllocationRepository;
    }

    @PostMapping("/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SplitAllocationPreview> previewSplit(@RequestParam String gameId,
                                                               @RequestParam(defaultValue = "EQUAL") SplitType splitType,
                                                               @RequestBody(required = false) List<PlayerShareRequest> allocations) {
        return ResponseEntity.ok(expenseService.previewSplit(gameId, splitType, allocations));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SplitAllocationPreview> confirmSplit(@Valid @RequestBody ConfirmSplitRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(expenseService.confirmSplit(request, performedBy));
    }

    @GetMapping("/game/{gameId}")
    public ResponseEntity<List<Expense>> getExpensesByGame(@PathVariable String gameId) {
        return ResponseEntity.ok(expenseRepository.findByGameId(gameId));
    }

    @GetMapping("/allocations/{gameId}")
    public ResponseEntity<List<ExpenseAllocation>> getAllocationsByGame(@PathVariable String gameId) {
        return ResponseEntity.ok(expenseAllocationRepository.findByGameId(gameId));
    }

    @GetMapping("/allocations/player/{playerId}")
    public ResponseEntity<List<ExpenseAllocation>> getAllocationsByPlayer(@PathVariable String playerId) {
        return ResponseEntity.ok(expenseAllocationRepository.findByPlayerId(playerId));
    }
}

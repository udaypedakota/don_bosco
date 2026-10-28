package com.smashclub.controller;

import com.smashclub.dto.ReportDTO.*;
import com.smashclub.model.Game;
import com.smashclub.model.Payment;
import com.smashclub.repository.GameRepository;
import com.smashclub.repository.PaymentRepository;
import com.smashclub.service.ReportService;
import com.smashclub.util.CsvExportUtil;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final GameRepository gameRepository;
    private final PaymentRepository paymentRepository;

    public ReportController(ReportService reportService,
                            GameRepository gameRepository,
                            PaymentRepository paymentRepository) {
        this.reportService = reportService;
        this.gameRepository = gameRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/admin-dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardStats> getAdminDashboardStats() {
        return ResponseEntity.ok(reportService.getAdminDashboardStats());
    }

    @GetMapping("/player-dashboard/{playerId}")
    public ResponseEntity<PlayerDashboardStats> getPlayerDashboardStats(@PathVariable String playerId) {
        return ResponseEntity.ok(reportService.getPlayerDashboardStats(playerId));
    }

    @GetMapping("/player-statements")
    public ResponseEntity<List<PlayerFinancialStatement>> getPlayerStatements() {
        return ResponseEntity.ok(reportService.getPlayerStatements());
    }

    @GetMapping("/export/games")
    public ResponseEntity<InputStreamResource> exportGamesToCsv() {
        List<Game> games = gameRepository.findAllByOrderByGameDateDescStartTimeDesc();
        ByteArrayInputStream stream = CsvExportUtil.exportGamesToCsv(games);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=smash-club-games.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new InputStreamResource(stream));
    }

    @GetMapping("/export/payments")
    public ResponseEntity<InputStreamResource> exportPaymentsToCsv() {
        List<Payment> payments = paymentRepository.findAllByOrderByPaymentDateDesc();
        ByteArrayInputStream stream = CsvExportUtil.exportPaymentsToCsv(payments);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=smash-club-payments.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new InputStreamResource(stream));
    }

    @GetMapping("/export/player-statements")
    public ResponseEntity<InputStreamResource> exportPlayerStatementsToCsv() {
        List<PlayerFinancialStatement> statements = reportService.getPlayerStatements();
        ByteArrayInputStream stream = CsvExportUtil.exportPlayerStatementsToCsv(statements);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=smash-club-player-statements.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(new InputStreamResource(stream));
    }
}

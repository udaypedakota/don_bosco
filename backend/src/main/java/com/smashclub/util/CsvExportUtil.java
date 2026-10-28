package com.smashclub.util;

import com.smashclub.dto.ReportDTO.PlayerFinancialStatement;
import com.smashclub.model.Game;
import com.smashclub.model.Payment;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class CsvExportUtil {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public static ByteArrayInputStream exportGamesToCsv(List<Game> games) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out)) {
            // Header
            writer.println("Game ID,Title,Court Name,Location,Date,Start Time,End Time,Total Cost (INR),Organizer,Status");

            for (Game g : games) {
                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                        escapeCsv(g.getId()),
                        escapeCsv(g.getTitle()),
                        escapeCsv(g.getCourtName()),
                        escapeCsv(g.getLocation()),
                        g.getGameDate() != null ? g.getGameDate().format(DATE_FORMATTER) : "",
                        g.getStartTime() != null ? g.getStartTime().toString() : "",
                        g.getEndTime() != null ? g.getEndTime().toString() : "",
                        g.getTotalCost() != null ? g.getTotalCost().toPlainString() : "0.00",
                        escapeCsv(g.getOrganizerName()),
                        g.getStatus()
                );
            }
            writer.flush();
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    public static ByteArrayInputStream exportPaymentsToCsv(List<Payment> payments) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out)) {
            // Header
            writer.println("Payment Ref,Payer Name,Payee Name,Amount (INR),Payment Method,Transaction Reference (UTR),Payment Date,Status,Verified By Admin");

            for (Payment p : payments) {
                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                        escapeCsv(p.getPaymentReferenceNumber()),
                        escapeCsv(p.getPayerPlayerName()),
                        escapeCsv(p.getPayeePlayerName()),
                        p.getAmount() != null ? p.getAmount().toPlainString() : "0.00",
                        p.getPaymentMethod(),
                        escapeCsv(p.getTransactionReference()),
                        p.getPaymentDate() != null ? p.getPaymentDate().format(DATE_TIME_FORMATTER) : "",
                        p.getStatus(),
                        p.isVerifiedByAdmin() ? "Yes" : "No"
                );
            }
            writer.flush();
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    public static ByteArrayInputStream exportPlayerStatementsToCsv(List<PlayerFinancialStatement> statements) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(out)) {
            // Header
            writer.println("Player ID,Player Name,Games Played,Total Expense Share (INR),Total Paid (INR),Outstanding Balance (INR),Financial Status");

            for (PlayerFinancialStatement s : statements) {
                writer.printf("\"%s\",\"%s\",\"%d\",\"%s\",\"%s\",\"%s\",\"%s\"%n",
                        escapeCsv(s.getUniquePlayerId()),
                        escapeCsv(s.getPlayerName()),
                        s.getGamesPlayed(),
                        s.getTotalShare() != null ? s.getTotalShare().toPlainString() : "0.00",
                        s.getTotalPaid() != null ? s.getTotalPaid().toPlainString() : "0.00",
                        s.getOutstandingBalance() != null ? s.getOutstandingBalance().toPlainString() : "0.00",
                        s.getStatus()
                );
            }
            writer.flush();
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    private static String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}

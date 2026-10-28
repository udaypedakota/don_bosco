package com.smashclub.config;

import com.smashclub.model.*;
import com.smashclub.repository.*;
import com.smashclub.util.FinancialCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final GameRepository gameRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseAllocationRepository expenseAllocationRepository;
    private final PaymentRepository paymentRepository;
    private final SettlementRepository settlementRepository;
    private final GroupSettingRepository groupSettingRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PlayerRepository playerRepository,
                           GameRepository gameRepository,
                           GameParticipantRepository gameParticipantRepository,
                           ExpenseRepository expenseRepository,
                           ExpenseAllocationRepository expenseAllocationRepository,
                           PaymentRepository paymentRepository,
                           SettlementRepository settlementRepository,
                           GroupSettingRepository groupSettingRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.playerRepository = playerRepository;
        this.gameRepository = gameRepository;
        this.gameParticipantRepository = gameParticipantRepository;
        this.expenseRepository = expenseRepository;
        this.expenseAllocationRepository = expenseAllocationRepository;
        this.paymentRepository = paymentRepository;
        this.settlementRepository = settlementRepository;
        this.groupSettingRepository = groupSettingRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            seedGroupSettings();
            if (playerRepository.count() == 0) {
                log.info("Seeding initial 7 Smash Club players and demo data...");
                seedInitialData();
            } else {
                log.info("Database already contains {} players. Skipping initial seed.", playerRepository.count());
            }
        } catch (Exception e) {
            log.warn("Database initialization notice (MongoDB might be initializing or offline): {}", e.getMessage());
        }
    }

    private void seedGroupSettings() {
        if (groupSettingRepository.count() == 0) {
            GroupSetting setting = new GroupSetting();
            setting.setGroupName("Smash Club");
            setting.setCurrency("INR");
            setting.setCurrencySymbol("₹");
            setting.setTimezone("Asia/Kolkata");
            setting.setDefaultCourtName("Star Badminton Arena, Court 3");
            setting.setDefaultCourtCost(new BigDecimal("600.00"));
            setting.setDefaultShuttleCost(new BigDecimal("240.00"));
            setting.setAnnouncement("Welcome to Smash Club! Regular Morning Sessions: Mon, Wed, Fri & Sat 6:00 AM - 8:00 AM.");
            groupSettingRepository.save(setting);
            log.info("Seeded group settings for Smash Club.");
        }
    }

    private void seedInitialData() {
        // 7 Initial Players
        List<Player> players = new ArrayList<>();
        players.add(new Player("SC-001", "Vikram Rao", "9876543210", "vikram.rao@smashclub.in", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"));
        players.add(new Player("SC-002", "Ananya Sharma", "9876543211", "ananya.sharma@smashclub.in", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"));
        players.add(new Player("SC-003", "Karthik Reddy", "9876543212", "karthik.reddy@smashclub.in", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"));
        players.add(new Player("SC-004", "Priya Nair", "9876543213", "priya.nair@smashclub.in", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"));
        players.add(new Player("SC-005", "Rahul Verma", "9876543214", "rahul.verma@smashclub.in", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"));
        players.add(new Player("SC-006", "Sneha Patel", "9876543215", "sneha.patel@smashclub.in", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"));
        players.add(new Player("SC-007", "Arjun Das", "9876543216", "arjun.das@smashclub.in", "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80"));

        List<Player> savedPlayers = playerRepository.saveAll(players);
        Player adminPlayer = savedPlayers.get(0); // Vikram Rao

        // Create Users: 1 Admin and 6 Players
        User adminUser = new User("admin", passwordEncoder.encode("SmashAdmin123!"), adminPlayer.getEmail(), adminPlayer.getMobileNumber(), Role.ROLE_ADMIN, adminPlayer.getId());
        userRepository.save(adminUser);

        // Also create a demo player user "player" mapped to Ananya Sharma (SC-002)
        Player playerUserRef = savedPlayers.get(1);
        User playerUser = new User("player", passwordEncoder.encode("SmashPlayer123!"), playerUserRef.getEmail(), playerUserRef.getMobileNumber(), Role.ROLE_PLAYER, playerUserRef.getId());
        userRepository.save(playerUser);

        // Seed users for all players with easy login (username = first name lower case)
        for (int i = 0; i < savedPlayers.size(); i++) {
            Player p = savedPlayers.get(i);
            String uname = p.getName().split(" ")[0].toLowerCase();
            if (!userRepository.existsByUsername(uname)) {
                User u = new User(uname, passwordEncoder.encode("Smash@123"), p.getEmail(), p.getMobileNumber(), i == 0 ? Role.ROLE_ADMIN : Role.ROLE_PLAYER, p.getId());
                userRepository.save(u);
            }
        }

        // Demo Game 1: Past completed game with exact prompt example!
        // "Example: An organizer pays ₹840 for six players. Each share is ₹140, and the organizer's own share is ₹140. The other five players owe the organizer ₹700 collectively."
        Game game1 = new Game();
        game1.setTitle("Saturday Morning Smash Battle");
        game1.setCourtName("Star Badminton Arena, Court 3");
        game1.setLocation("Gachibowli, Hyderabad");
        game1.setGameDate(LocalDate.now().minusDays(3));
        game1.setStartTime(LocalTime.of(6, 0));
        game1.setEndTime(LocalTime.of(8, 0));
        game1.setCourtBookingCost(new BigDecimal("600.00"));
        game1.setShuttlecockExpenses(new BigDecimal("240.00"));
        game1.setAdditionalExpenses(BigDecimal.ZERO);
        game1.recalculateTotalCost(); // ₹840.00
        game1.setOrganizerPlayerId(adminPlayer.getId());
        game1.setOrganizerName(adminPlayer.getName());
        game1.setStatus("COMPLETED");
        game1.setSplitType(SplitType.EQUAL);
        game1.setFinancialConfirmed(true);
        game1.setNotes("Intense doubles matches. 6 players attended.");

        // First 6 players attended
        List<String> participantIds = new ArrayList<>();
        List<String> attendedIds = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            participantIds.add(savedPlayers.get(i).getId());
            attendedIds.add(savedPlayers.get(i).getId());
        }
        game1.setParticipantPlayerIds(participantIds);
        game1.setAttendedPlayerIds(attendedIds);
        game1 = gameRepository.save(game1);

        // Record Expense of ₹840 paid by Vikram Rao (Organizer)
        Expense expense = new Expense(game1.getId(), "Court Booking & Yonex Mavis 350 Shuttles", "COURT_BOOKING",
                new BigDecimal("840.00"), adminPlayer.getId(), adminPlayer.getName(), SplitType.EQUAL);
        expense.setParticipantCount(6);
        expense = expenseRepository.save(expense);

        // Shares: ₹840 / 6 = ₹140.00 each
        List<BigDecimal> shares = FinancialCalculator.splitEqually(expense.getTotalAmount(), 6);

        for (int i = 0; i < 6; i++) {
            Player p = savedPlayers.get(i);
            BigDecimal share = shares.get(i);

            // Create GameParticipant
            GameParticipant gp = new GameParticipant(game1.getId(), p.getId(), p.getName());
            gp.setAttended(true);
            gp.setShareAmount(share);

            // Create ExpenseAllocation
            ExpenseAllocation alloc = new ExpenseAllocation(expense.getId(), game1.getId(), p.getId(), p.getName(), share);

            // If player is organizer (Vikram), their share ₹140 was self-covered
            if (p.getId().equals(adminPlayer.getId())) {
                gp.setPaidAmount(share);
                gp.setPaymentStatus(PaymentStatus.PAID);
                alloc.setPaidAmount(share);
                alloc.setStatus(PaymentStatus.PAID);
                alloc.setBalanceAmount(BigDecimal.ZERO);

                // Update Player summary
                p.setTotalGamesPlayed(1);
                p.setTotalExpenseShare(share);
                p.setTotalPaid(share);
                p.setOutstandingBalance(BigDecimal.ZERO);
            } else if (i == 1) { // Ananya paid ₹140 via UPI
                Payment payment = new Payment("PAY-20261025-001", game1.getId(), expense.getId(),
                        p.getId(), p.getName(), adminPlayer.getId(), adminPlayer.getName(),
                        new BigDecimal("140.00"), PaymentMethod.UPI, "UPI982736451290", PaymentStatus.PAID);
                payment.setVerifiedByAdmin(true);
                payment.setPaymentDate(LocalDateTime.now().minusDays(2));
                paymentRepository.save(payment);

                gp.setPaidAmount(share);
                gp.setPaymentStatus(PaymentStatus.PAID);
                alloc.setPaidAmount(share);
                alloc.setStatus(PaymentStatus.PAID);
                alloc.setBalanceAmount(BigDecimal.ZERO);

                p.setTotalGamesPlayed(1);
                p.setTotalExpenseShare(share);
                p.setTotalPaid(share);
                p.setOutstandingBalance(BigDecimal.ZERO);
            } else if (i == 2) { // Karthik paid partial ₹100 via Cash
                Payment payment = new Payment("PAY-20261025-002", game1.getId(), expense.getId(),
                        p.getId(), p.getName(), adminPlayer.getId(), adminPlayer.getName(),
                        new BigDecimal("100.00"), PaymentMethod.CASH, null, PaymentStatus.PAID);
                payment.setVerifiedByAdmin(true);
                payment.setPaymentDate(LocalDateTime.now().minusDays(2));
                paymentRepository.save(payment);

                gp.setPaidAmount(new BigDecimal("100.00"));
                gp.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
                alloc.setPaidAmount(new BigDecimal("100.00"));
                alloc.setStatus(PaymentStatus.PARTIALLY_PAID);
                alloc.setBalanceAmount(new BigDecimal("40.00"));

                p.setTotalGamesPlayed(1);
                p.setTotalExpenseShare(share);
                p.setTotalPaid(new BigDecimal("100.00"));
                p.setOutstandingBalance(new BigDecimal("40.00"));
            } else { // Priya, Rahul, Sneha are PENDING ₹140
                gp.setPaidAmount(BigDecimal.ZERO);
                gp.setPaymentStatus(PaymentStatus.PENDING);
                alloc.setPaidAmount(BigDecimal.ZERO);
                alloc.setStatus(PaymentStatus.PENDING);
                alloc.setBalanceAmount(share);

                p.setTotalGamesPlayed(1);
                p.setTotalExpenseShare(share);
                p.setTotalPaid(BigDecimal.ZERO);
                p.setOutstandingBalance(share);
            }

            gameParticipantRepository.save(gp);
            expenseAllocationRepository.save(alloc);
            playerRepository.save(p);
        }

        // Demo Game 2: Upcoming Game for tomorrow morning
        Game game2 = new Game();
        game2.setTitle("Mid-Week Morning Smash Session");
        game2.setCourtName("Star Badminton Arena, Court 2");
        game2.setLocation("Gachibowli, Hyderabad");
        game2.setGameDate(LocalDate.now().plusDays(1));
        game2.setStartTime(LocalTime.of(6, 30));
        game2.setEndTime(LocalTime.of(8, 30));
        game2.setCourtBookingCost(new BigDecimal("600.00"));
        game2.setShuttlecockExpenses(new BigDecimal("240.00"));
        game2.setAdditionalExpenses(new BigDecimal("60.00")); // electrolyte drinks
        game2.recalculateTotalCost(); // ₹900.00
        game2.setOrganizerPlayerId(adminPlayer.getId());
        game2.setOrganizerName(adminPlayer.getName());
        game2.setStatus("SCHEDULED");
        game2.setSplitType(SplitType.EQUAL);
        game2.setFinancialConfirmed(false);
        game2.setNotes("Hydration included. Bring non-marking shoes.");

        List<String> p2Ids = new ArrayList<>();
        for (Player p : savedPlayers) {
            p2Ids.add(p.getId());
        }
        game2.setParticipantPlayerIds(p2Ids);
        gameRepository.save(game2);

        for (Player p : savedPlayers) {
            GameParticipant gp2 = new GameParticipant(game2.getId(), p.getId(), p.getName());
            gp2.setAttended(true);
            gp2.setShareAmount(new BigDecimal("128.57"));
            gameParticipantRepository.save(gp2);
        }

        // Seed initial audit log
        auditLogRepository.save(new AuditLog("SEED_DATA_INITIALIZED", "System", "0", "Admin (Vikram Rao)", "Initialized 7 players, 2 games, expenses and allocations"));

        log.info("Finished seeding Smash Club data successfully!");
    }
}

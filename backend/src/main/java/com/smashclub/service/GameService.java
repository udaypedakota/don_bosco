package com.smashclub.service;

import com.smashclub.dto.GameDTO.*;
import com.smashclub.exception.BadRequestException;
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
public class GameService {

    private final GameRepository gameRepository;
    private final GameParticipantRepository gameParticipantRepository;
    private final PlayerRepository playerRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseAllocationRepository expenseAllocationRepository;
    private final AuditLogRepository auditLogRepository;

    public GameService(GameRepository gameRepository,
                       GameParticipantRepository gameParticipantRepository,
                       PlayerRepository playerRepository,
                       ExpenseRepository expenseRepository,
                       ExpenseAllocationRepository expenseAllocationRepository,
                       AuditLogRepository auditLogRepository) {
        this.gameRepository = gameRepository;
        this.gameParticipantRepository = gameParticipantRepository;
        this.playerRepository = playerRepository;
        this.expenseRepository = expenseRepository;
        this.expenseAllocationRepository = expenseAllocationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<GameResponse> getAllGames() {
        return gameRepository.findAllByOrderByGameDateDescStartTimeDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GameResponse getGameById(String id) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with ID: " + id));
        return mapToResponse(game);
    }

    public List<GameResponse> getGamesByPlayerId(String playerId) {
        return gameRepository.findByParticipantPlayerIdsContainingOrderByGameDateDesc(playerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GameResponse createGame(CreateGameRequest request, String performedBy) {
        Player organizer = playerRepository.findById(request.getOrganizerPlayerId())
                .orElseThrow(() -> new BadRequestException("Organizer player not found with ID: " + request.getOrganizerPlayerId()));

        Game game = new Game();
        game.setTitle(request.getTitle());
        game.setCourtName(request.getCourtName());
        game.setLocation(request.getLocation() != null ? request.getLocation() : "Hyderabad");
        game.setGameDate(request.getGameDate());
        game.setStartTime(request.getStartTime());
        game.setEndTime(request.getEndTime());
        game.setCourtBookingCost(request.getCourtBookingCost() != null ? request.getCourtBookingCost() : BigDecimal.ZERO);
        game.setShuttlecockExpenses(request.getShuttlecockExpenses() != null ? request.getShuttlecockExpenses() : BigDecimal.ZERO);
        game.setAdditionalExpenses(request.getAdditionalExpenses() != null ? request.getAdditionalExpenses() : BigDecimal.ZERO);
        game.recalculateTotalCost();
        game.setOrganizerPlayerId(organizer.getId());
        game.setOrganizerName(organizer.getName());
        game.setStatus("SCHEDULED");
        game.setSplitType(request.getSplitType() != null ? request.getSplitType() : SplitType.EQUAL);
        game.setNotes(request.getNotes());
        game.setFinancialConfirmed(false);

        List<String> participants = request.getParticipantPlayerIds() != null && !request.getParticipantPlayerIds().isEmpty()
                ? new ArrayList<>(request.getParticipantPlayerIds())
                : new ArrayList<>();

        // Ensure organizer is in participants if not already
        if (!participants.contains(organizer.getId())) {
            participants.add(organizer.getId());
        }

        game.setParticipantPlayerIds(participants);
        game.setAttendedPlayerIds(new ArrayList<>(participants)); // default all confirmed to attended
        Game saved = gameRepository.save(game);

        // Save participants
        createOrUpdateParticipants(saved, participants, participants);

        auditLogRepository.save(new AuditLog("GAME_CREATED", "Game", saved.getId(), performedBy,
                "Created game '" + saved.getTitle() + "' at " + saved.getCourtName() + " on " + saved.getGameDate()));

        return mapToResponse(saved);
    }

    public GameResponse updateGame(String id, UpdateGameRequest request, String performedBy) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with ID: " + id));

        game.setTitle(request.getTitle());
        game.setCourtName(request.getCourtName());
        game.setLocation(request.getLocation());
        if (request.getGameDate() != null) game.setGameDate(request.getGameDate());
        if (request.getStartTime() != null) game.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) game.setEndTime(request.getEndTime());

        if (request.getCourtBookingCost() != null) game.setCourtBookingCost(request.getCourtBookingCost());
        if (request.getShuttlecockExpenses() != null) game.setShuttlecockExpenses(request.getShuttlecockExpenses());
        if (request.getAdditionalExpenses() != null) game.setAdditionalExpenses(request.getAdditionalExpenses());
        game.recalculateTotalCost();

        if (request.getOrganizerPlayerId() != null) {
            Player org = playerRepository.findById(request.getOrganizerPlayerId()).orElse(null);
            if (org != null) {
                game.setOrganizerPlayerId(org.getId());
                game.setOrganizerName(org.getName());
            }
        }

        if (request.getStatus() != null) game.setStatus(request.getStatus());
        if (request.getSplitType() != null) game.setSplitType(request.getSplitType());
        if (request.getNotes() != null) game.setNotes(request.getNotes());

        if (request.getParticipantPlayerIds() != null) {
            game.setParticipantPlayerIds(request.getParticipantPlayerIds());
        }
        if (request.getAttendedPlayerIds() != null) {
            game.setAttendedPlayerIds(request.getAttendedPlayerIds());
        }

        Game saved = gameRepository.save(game);
        createOrUpdateParticipants(saved, saved.getParticipantPlayerIds(), saved.getAttendedPlayerIds());

        auditLogRepository.save(new AuditLog("GAME_UPDATED", "Game", saved.getId(), performedBy,
                "Updated game '" + saved.getTitle() + "'"));

        return mapToResponse(saved);
    }

    public GameResponse updateAttendance(String id, AttendanceUpdateRequest request, String performedBy) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with ID: " + id));

        game.setAttendedPlayerIds(request.getAttendedPlayerIds());
        Game saved = gameRepository.save(game);

        // Update attendance status on participants
        List<GameParticipant> participants = gameParticipantRepository.findByGameId(id);
        for (GameParticipant gp : participants) {
            boolean attended = request.getAttendedPlayerIds().contains(gp.getPlayerId());
            gp.setAttended(attended);
            gameParticipantRepository.save(gp);
        }

        auditLogRepository.save(new AuditLog("ATTENDANCE_UPDATED", "Game", saved.getId(), performedBy,
                "Updated attendance for game '" + saved.getTitle() + "'. Attended count: " + request.getAttendedPlayerIds().size()));

        return mapToResponse(saved);
    }

    public void cancelGame(String id, String performedBy) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Game not found with ID: " + id));

        game.setStatus("CANCELLED");
        gameRepository.save(game);

        auditLogRepository.save(new AuditLog("GAME_CANCELLED", "Game", game.getId(), performedBy,
                "Cancelled game '" + game.getTitle() + "' scheduled on " + game.getGameDate()));
    }

    private void createOrUpdateParticipants(Game game, List<String> participantIds, List<String> attendedIds) {
        List<GameParticipant> existing = gameParticipantRepository.findByGameId(game.getId());
        Map<String, GameParticipant> map = existing.stream()
                .collect(Collectors.toMap(GameParticipant::getPlayerId, gp -> gp, (a, b) -> a));

        List<Player> players = playerRepository.findAllById(participantIds);
        Map<String, Player> playerMap = players.stream().collect(Collectors.toMap(Player::getId, p -> p));

        int attendedCount = attendedIds != null && !attendedIds.isEmpty() ? attendedIds.size() : Math.max(participantIds.size(), 1);
        BigDecimal perPlayerEstimate = game.getTotalCost().divide(BigDecimal.valueOf(attendedCount), 2, RoundingMode.HALF_UP);

        for (String pid : participantIds) {
            Player p = playerMap.get(pid);
            if (p == null) continue;

            GameParticipant gp = map.get(pid);
            if (gp == null) {
                gp = new GameParticipant(game.getId(), p.getId(), p.getName());
            }
            gp.setAttended(attendedIds != null && attendedIds.contains(pid));
            if (!game.isFinancialConfirmed()) {
                gp.setShareAmount(perPlayerEstimate);
            }
            gameParticipantRepository.save(gp);
        }
    }

    public GameResponse mapToResponse(Game g) {
        GameResponse res = new GameResponse();
        res.setId(g.getId());
        res.setTitle(g.getTitle());
        res.setCourtName(g.getCourtName());
        res.setLocation(g.getLocation());
        res.setGameDate(g.getGameDate());
        res.setStartTime(g.getStartTime());
        res.setEndTime(g.getEndTime());
        res.setCourtBookingCost(g.getCourtBookingCost());
        res.setShuttlecockExpenses(g.getShuttlecockExpenses());
        res.setAdditionalExpenses(g.getAdditionalExpenses());
        res.setTotalCost(g.getTotalCost());
        res.setOrganizerPlayerId(g.getOrganizerPlayerId());
        res.setOrganizerName(g.getOrganizerName());
        res.setStatus(g.getStatus());
        res.setSplitType(g.getSplitType());
        res.setFinancialConfirmed(g.isFinancialConfirmed());
        res.setNotes(g.getNotes());

        List<GameParticipant> participants = gameParticipantRepository.findByGameId(g.getId());
        List<ParticipantInfo> infoList = new ArrayList<>();

        Map<String, Player> playerMap = playerRepository.findAllById(
                participants.stream().map(GameParticipant::getPlayerId).collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(Player::getId, p -> p));

        for (GameParticipant gp : participants) {
            Player p = playerMap.get(gp.getPlayerId());
            String avatar = p != null ? p.getAvatarUrl() : "";
            infoList.add(new ParticipantInfo(
                    gp.getPlayerId(),
                    gp.getPlayerName(),
                    avatar,
                    gp.isAttended(),
                    gp.getShareAmount(),
                    gp.getPaidAmount(),
                    gp.getPaymentStatus() != null ? gp.getPaymentStatus().name() : PaymentStatus.PENDING.name()
            ));
        }
        res.setParticipants(infoList);

        int count = (int) infoList.stream().filter(ParticipantInfo::isAttended).count();
        if (count == 0) count = Math.max(infoList.size(), 1);
        res.setPerPlayerEstimatedShare(g.getTotalCost().divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP));

        return res;
    }
}

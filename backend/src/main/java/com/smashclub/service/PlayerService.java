package com.smashclub.service;

import com.smashclub.dto.PlayerDTO.*;
import com.smashclub.exception.BadRequestException;
import com.smashclub.exception.ResourceNotFoundException;
import com.smashclub.model.AuditLog;
import com.smashclub.model.Player;
import com.smashclub.repository.AuditLogRepository;
import com.smashclub.repository.PlayerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final AuditLogRepository auditLogRepository;

    public PlayerService(PlayerRepository playerRepository, AuditLogRepository auditLogRepository) {
        this.playerRepository = playerRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<PlayerResponse> getAllPlayers() {
        return playerRepository.findAllByOrderByJoinDateAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PlayerResponse getPlayerById(String id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found with ID: " + id));
        return mapToResponse(player);
    }

    public PlayerResponse createPlayer(CreatePlayerRequest request, String performedBy) {
        // Validate unique mobile number
        if (playerRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new BadRequestException("A player with mobile number " + request.getMobileNumber() + " already exists.");
        }

        long count = playerRepository.count() + 1;
        String uniqueId = String.format("SC-%03d", count);

        // Generate invitation token
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        Player player = new Player();
        player.setUniquePlayerId(uniqueId);
        player.setName(request.getName());
        player.setMobileNumber(request.getMobileNumber());
        player.setEmail(request.getEmail());
        player.setAvatarUrl(request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()
                ? request.getAvatarUrl()
                : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80");
        player.setNotes(request.getNotes());
        player.setInvitationToken(token);
        player.setAccountActivated(false);

        Player saved = playerRepository.save(player);

        auditLogRepository.save(new AuditLog("PLAYER_CREATED", "Player", saved.getId(), performedBy,
                "Created player " + saved.getName() + " (" + saved.getUniquePlayerId() + ")"));

        return mapToResponse(saved);
    }

    public PlayerResponse updatePlayer(String id, UpdatePlayerRequest request, String performedBy) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found with ID: " + id));

        // Check if mobile number changed and conflicts with another player
        if (!player.getMobileNumber().equals(request.getMobileNumber())) {
            if (playerRepository.existsByMobileNumber(request.getMobileNumber())) {
                throw new BadRequestException("Mobile number " + request.getMobileNumber() + " is already in use by another player.");
            }
            player.setMobileNumber(request.getMobileNumber());
        }

        player.setName(request.getName());
        player.setEmail(request.getEmail());
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            player.setAvatarUrl(request.getAvatarUrl());
        }
        player.setActive(request.isActive());
        player.setNotes(request.getNotes());

        Player updated = playerRepository.save(player);

        auditLogRepository.save(new AuditLog("PLAYER_UPDATED", "Player", updated.getId(), performedBy,
                "Updated player details for " + updated.getName()));

        return mapToResponse(updated);
    }

    public void deactivatePlayer(String id, String performedBy) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found with ID: " + id));
        player.setActive(false);
        playerRepository.save(player);

        auditLogRepository.save(new AuditLog("PLAYER_DEACTIVATED", "Player", player.getId(), performedBy,
                "Deactivated player " + player.getName()));
    }

    public void activatePlayer(String id, String performedBy) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found with ID: " + id));
        player.setActive(true);
        playerRepository.save(player);

        auditLogRepository.save(new AuditLog("PLAYER_ACTIVATED", "Player", player.getId(), performedBy,
                "Reactivated player " + player.getName()));
    }

    public InvitePlayerResponse generateInvite(String id) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player not found with ID: " + id));

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        player.setInvitationToken(token);
        playerRepository.save(player);

        String link = "/activate?token=" + token;
        return new InvitePlayerResponse(token, link, player.getName(), player.getMobileNumber());
    }

    public PlayerResponse mapToResponse(Player p) {
        PlayerResponse res = new PlayerResponse();
        res.setId(p.getId());
        res.setUniquePlayerId(p.getUniquePlayerId());
        res.setName(p.getName());
        res.setMobileNumber(p.getMobileNumber());
        res.setEmail(p.getEmail());
        res.setAvatarUrl(p.getAvatarUrl());
        res.setJoinDate(p.getJoinDate());
        res.setActive(p.isActive());
        res.setTotalGamesPlayed(p.getTotalGamesPlayed());
        res.setTotalExpenseShare(p.getTotalExpenseShare());
        res.setTotalPaid(p.getTotalPaid());
        res.setOutstandingBalance(p.getOutstandingBalance());
        res.setAccountActivated(p.isAccountActivated());
        res.setNotes(p.getNotes());
        return res;
    }
}

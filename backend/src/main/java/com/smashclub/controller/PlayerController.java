package com.smashclub.controller;

import com.smashclub.dto.PlayerDTO.*;
import com.smashclub.service.PlayerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @GetMapping
    public ResponseEntity<List<PlayerResponse>> getAllPlayers() {
        return ResponseEntity.ok(playerService.getAllPlayers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerResponse> getPlayerById(@PathVariable String id) {
        return ResponseEntity.ok(playerService.getPlayerById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlayerResponse> createPlayer(@Valid @RequestBody CreatePlayerRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(playerService.createPlayer(request, performedBy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlayerResponse> updatePlayer(@PathVariable String id, @Valid @RequestBody UpdatePlayerRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(playerService.updatePlayer(id, request, performedBy));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivatePlayer(@PathVariable String id, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        playerService.deactivatePlayer(id, performedBy);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reactivatePlayer(@PathVariable String id, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        playerService.activatePlayer(id, performedBy);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/invite")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InvitePlayerResponse> invitePlayer(@PathVariable String id) {
        return ResponseEntity.ok(playerService.generateInvite(id));
    }
}

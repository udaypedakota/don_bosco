package com.smashclub.controller;

import com.smashclub.dto.GameDTO.*;
import com.smashclub.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public ResponseEntity<List<GameResponse>> getAllGames() {
        return ResponseEntity.ok(gameService.getAllGames());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameResponse> getGameById(@PathVariable String id) {
        return ResponseEntity.ok(gameService.getGameById(id));
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<GameResponse>> getGamesByPlayerId(@PathVariable String playerId) {
        return ResponseEntity.ok(gameService.getGamesByPlayerId(playerId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GameResponse> createGame(@Valid @RequestBody CreateGameRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(gameService.createGame(request, performedBy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GameResponse> updateGame(@PathVariable String id, @Valid @RequestBody UpdateGameRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(gameService.updateGame(id, request, performedBy));
    }

    @PutMapping("/{id}/attendance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GameResponse> updateAttendance(@PathVariable String id, @Valid @RequestBody AttendanceUpdateRequest request, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        return ResponseEntity.ok(gameService.updateAttendance(id, request, performedBy));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> cancelGame(@PathVariable String id, Principal principal) {
        String performedBy = principal != null ? principal.getName() : "Admin";
        gameService.cancelGame(id, performedBy);
        return ResponseEntity.noContent().build();
    }
}

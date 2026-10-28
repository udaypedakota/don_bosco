package com.smashclub.controller;

import com.smashclub.dto.AuthDTO.*;
import com.smashclub.model.User;
import com.smashclub.repository.UserRepository;
import com.smashclub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/activate")
    public ResponseEntity<LoginResponse> activate(@Valid @RequestBody ActivationRequest request) {
        return ResponseEntity.ok(authService.activateAccount(request));
    }

    @PutMapping("/language")
    public ResponseEntity<Map<String, String>> updateLanguage(@Valid @RequestBody LanguagePreferenceRequest request, Principal principal) {
        if (principal != null) {
            authService.updatePreferredLanguage(principal.getName(), request.getLanguage());
        }
        Map<String, String> res = new HashMap<>();
        res.put("status", "success");
        res.put("preferredLanguage", request.getLanguage());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("role", user.getRole());
        data.put("playerId", user.getPlayerId());
        data.put("preferredLanguage", user.getPreferredLanguage());
        return ResponseEntity.ok(data);
    }
}

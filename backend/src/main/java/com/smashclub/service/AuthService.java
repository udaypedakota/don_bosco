package com.smashclub.service;

import com.smashclub.dto.AuthDTO.*;
import com.smashclub.exception.BadRequestException;
import com.smashclub.exception.ResourceNotFoundException;
import com.smashclub.model.Player;
import com.smashclub.model.Role;
import com.smashclub.model.User;
import com.smashclub.repository.PlayerRepository;
import com.smashclub.repository.UserRepository;
import com.smashclub.util.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PlayerRepository playerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.playerRepository = playerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse login(LoginRequest request) {
        // Allow login with either username or mobile number
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByMobileNumber(request.getUsername());
        }

        if (userOpt.isEmpty()) {
            throw new BadCredentialsException("Invalid username or password");
        }

        User user = userOpt.get();
        if (!user.isActive()) {
            throw new BadRequestException("This account is inactive. Please contact the administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        String playerName = "Admin";
        String avatarUrl = "";
        if (user.getPlayerId() != null) {
            Optional<Player> playerOpt = playerRepository.findById(user.getPlayerId());
            if (playerOpt.isPresent()) {
                playerName = playerOpt.get().getName();
                avatarUrl = playerOpt.get().getAvatarUrl();
            }
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getId(), user.getPlayerId());

        return new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getRole(),
                user.getPlayerId(),
                playerName,
                avatarUrl,
                user.getPreferredLanguage()
        );
    }

    public LoginResponse activateAccount(ActivationRequest request) {
        Player player = playerRepository.findByInvitationToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired invitation token"));

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken. Please choose another.");
        }

        player.setAccountActivated(true);
        player.setInvitationToken(null);
        playerRepository.save(player);

        User newUser = new User(
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()),
                player.getEmail(),
                player.getMobileNumber(),
                Role.ROLE_PLAYER,
                player.getId()
        );
        userRepository.save(newUser);

        String token = jwtUtil.generateToken(newUser.getUsername(), newUser.getRole().name(), newUser.getId(), newUser.getPlayerId());

        return new LoginResponse(
                token,
                newUser.getId(),
                newUser.getUsername(),
                newUser.getEmail(),
                newUser.getMobileNumber(),
                newUser.getRole(),
                player.getId(),
                player.getName(),
                player.getAvatarUrl(),
                newUser.getPreferredLanguage()
        );
    }

    public void updatePreferredLanguage(String username, String language) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if ("te".equalsIgnoreCase(language) || "en".equalsIgnoreCase(language)) {
            user.setPreferredLanguage(language.toLowerCase());
            userRepository.save(user);
        }
    }
}

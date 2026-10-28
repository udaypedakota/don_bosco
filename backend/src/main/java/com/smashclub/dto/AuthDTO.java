package com.smashclub.dto;

import com.smashclub.model.Role;
import jakarta.validation.constraints.NotBlank;

public class AuthDTO {

    public static class LoginRequest {
        @NotBlank(message = "Username or mobile number is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;

        public LoginRequest() {}

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private String token;
        private String tokenType = "Bearer";
        private String userId;
        private String username;
        private String email;
        private String mobileNumber;
        private Role role;
        private String playerId;
        private String playerName;
        private String avatarUrl;
        private String preferredLanguage;

        public LoginResponse() {}

        public LoginResponse(String token, String userId, String username, String email,
                             String mobileNumber, Role role, String playerId, String playerName,
                             String avatarUrl, String preferredLanguage) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.mobileNumber = mobileNumber;
            this.role = role;
            this.playerId = playerId;
            this.playerName = playerName;
            this.avatarUrl = avatarUrl;
            this.preferredLanguage = preferredLanguage;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }

        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

        public String getPreferredLanguage() { return preferredLanguage; }
        public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;

        private String email;

        @NotBlank(message = "Mobile number is required")
        private String mobileNumber;

        private Role role = Role.ROLE_PLAYER;
        private String playerId;

        public RegisterRequest() {}

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }

        public String getPlayerId() { return playerId; }
        public void setPlayerId(String playerId) { this.playerId = playerId; }
    }

    public static class ActivationRequest {
        @NotBlank(message = "Invitation token is required")
        private String token;

        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;

        public ActivationRequest() {}

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LanguagePreferenceRequest {
        @NotBlank(message = "Language code is required (en or te)")
        private String language;

        public LanguagePreferenceRequest() {}

        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
    }
}

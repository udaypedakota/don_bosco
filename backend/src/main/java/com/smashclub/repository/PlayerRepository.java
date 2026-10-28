package com.smashclub.repository;

import com.smashclub.model.Player;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends MongoRepository<Player, String> {
    Optional<Player> findByUniquePlayerId(String uniquePlayerId);
    Optional<Player> findByMobileNumber(String mobileNumber);
    Optional<Player> findByInvitationToken(String token);
    boolean existsByMobileNumber(String mobileNumber);
    boolean existsByUniquePlayerId(String uniquePlayerId);
    List<Player> findAllByOrderByJoinDateAsc();
    List<Player> findByActive(boolean active);
}

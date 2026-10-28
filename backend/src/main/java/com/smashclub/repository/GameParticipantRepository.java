package com.smashclub.repository;

import com.smashclub.model.GameParticipant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameParticipantRepository extends MongoRepository<GameParticipant, String> {
    List<GameParticipant> findByGameId(String gameId);
    List<GameParticipant> findByPlayerId(String playerId);
    Optional<GameParticipant> findByGameIdAndPlayerId(String gameId, String playerId);
    void deleteByGameId(String gameId);
}

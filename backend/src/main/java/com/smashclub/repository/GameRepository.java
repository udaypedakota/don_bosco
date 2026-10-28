package com.smashclub.repository;

import com.smashclub.model.Game;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GameRepository extends MongoRepository<Game, String> {
    List<Game> findAllByOrderByGameDateDescStartTimeDesc();
    List<Game> findByGameDateBetweenOrderByGameDateDesc(LocalDate start, LocalDate end);
    List<Game> findByStatusOrderByGameDateDesc(String status);
    List<Game> findByParticipantPlayerIdsContainingOrderByGameDateDesc(String playerId);
    List<Game> findByAttendedPlayerIdsContainingOrderByGameDateDesc(String playerId);
}

package com.smashclub.repository;

import com.smashclub.model.Settlement;
import com.smashclub.model.SettlementStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends MongoRepository<Settlement, String> {
    List<Settlement> findByStatus(SettlementStatus status);
    List<Settlement> findByFromPlayerIdOrToPlayerId(String fromPlayerId, String toPlayerId);
    List<Settlement> findAllByOrderByCreatedAtDesc();
}

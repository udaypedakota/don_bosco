package com.smashclub.repository;

import com.smashclub.model.ExpenseAllocation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseAllocationRepository extends MongoRepository<ExpenseAllocation, String> {
    List<ExpenseAllocation> findByExpenseId(String expenseId);
    List<ExpenseAllocation> findByGameId(String gameId);
    List<ExpenseAllocation> findByPlayerId(String playerId);
    Optional<ExpenseAllocation> findByExpenseIdAndPlayerId(String expenseId, String playerId);
    void deleteByExpenseId(String expenseId);
    void deleteByGameId(String gameId);
}

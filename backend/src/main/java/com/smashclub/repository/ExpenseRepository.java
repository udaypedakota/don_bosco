package com.smashclub.repository;

import com.smashclub.model.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepository extends MongoRepository<Expense, String> {
    List<Expense> findByGameId(String gameId);
    List<Expense> findByPaidByPlayerId(String paidByPlayerId);
    List<Expense> findAllByOrderByCreatedAtDesc();
}

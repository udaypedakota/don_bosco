package com.smashclub.repository;

import com.smashclub.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByPaymentReferenceNumber(String paymentReferenceNumber);
    Optional<Payment> findByTransactionReference(String transactionReference);
    boolean existsByTransactionReference(String transactionReference);
    List<Payment> findByPayerPlayerIdOrderByPaymentDateDesc(String payerPlayerId);
    List<Payment> findByPayeePlayerIdOrderByPaymentDateDesc(String payeePlayerId);
    List<Payment> findByGameId(String gameId);
    List<Payment> findAllByOrderByPaymentDateDesc();
}

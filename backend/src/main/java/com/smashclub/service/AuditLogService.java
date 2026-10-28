package com.smashclub.service;

import com.smashclub.model.AuditLog;
import com.smashclub.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    public void logAction(String action, String entityName, String entityId, String performedBy, String details) {
        auditLogRepository.save(new AuditLog(action, entityName, entityId, performedBy, details));
    }
}

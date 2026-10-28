package com.smashclub.repository;

import com.smashclub.model.GroupSetting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupSettingRepository extends MongoRepository<GroupSetting, String> {
    Optional<GroupSetting> findFirstBy();
}

package com.smashclub.controller;

import com.smashclub.model.GroupSetting;
import com.smashclub.repository.GroupSettingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class GroupSettingController {

    private final GroupSettingRepository groupSettingRepository;

    public GroupSettingController(GroupSettingRepository groupSettingRepository) {
        this.groupSettingRepository = groupSettingRepository;
    }

    @GetMapping
    public ResponseEntity<GroupSetting> getSettings() {
        return ResponseEntity.ok(groupSettingRepository.findFirstBy().orElse(new GroupSetting()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GroupSetting> updateSettings(@RequestBody GroupSetting updated) {
        GroupSetting setting = groupSettingRepository.findFirstBy().orElse(new GroupSetting());
        setting.setGroupName(updated.getGroupName());
        setting.setDefaultCourtName(updated.getDefaultCourtName());
        setting.setDefaultCourtCost(updated.getDefaultCourtCost());
        setting.setDefaultShuttleCost(updated.getDefaultShuttleCost());
        setting.setAnnouncement(updated.getAnnouncement());
        return ResponseEntity.ok(groupSettingRepository.save(setting));
    }
}

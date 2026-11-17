package com.companion.controllers;

import com.companion.dtos.admin.AdminStatsResponseDTO;
import com.companion.services.AdminStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Números do painel de administração (acesso só de ADMIN, via SecurityConfig). */
@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final AdminStatsService statsService;

    public AdminStatsController(AdminStatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping
    public AdminStatsResponseDTO get() {
        return statsService.getStats();
    }
}

package com.companion.controllers;

import com.companion.dtos.common.PageResponse;
import com.companion.dtos.ticket.TicketReplyRequestDTO;
import com.companion.dtos.ticket.TicketResponseDTO;
import com.companion.enums.TicketStatus;
import com.companion.services.TicketService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/** Gerenciar tickets de suporte (acesso só de ADMIN, via SecurityConfig). */
@Validated
@RestController
@RequestMapping("/api/admin/tickets")
public class AdminTicketController {

    private final TicketService service;

    public AdminTicketController(TicketService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<TicketResponseDTO> list(@RequestParam(defaultValue = "OPEN") TicketStatus status,
                                                @RequestParam(defaultValue = "0") @Min(0) int page,
                                                @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return service.listForAdministration(status, page, size);
    }

    @PostMapping("/{id}/reply")
    public TicketResponseDTO reply(@PathVariable Long id, @Valid @RequestBody TicketReplyRequestDTO request) {
        return service.reply(id, request);
    }

    @PostMapping("/{id}/close")
    public TicketResponseDTO close(@PathVariable Long id) {
        return service.close(id);
    }
}

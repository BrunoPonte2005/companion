package com.companion.controllers;

import com.companion.dtos.common.PageResponse;
import com.companion.dtos.ticket.TicketCreateRequestDTO;
import com.companion.dtos.ticket.TicketResponseDTO;
import com.companion.services.TicketService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

/** Tickets de suporte do usuário logado. */
@Validated
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TicketResponseDTO> create(@Valid @RequestBody TicketCreateRequestDTO request) {
        TicketResponseDTO response = service.create(request);
        return ResponseEntity.created(URI.create("/api/tickets/" + response.id())).body(response);
    }

    @GetMapping("/mine")
    public PageResponse<TicketResponseDTO> mine(@RequestParam(defaultValue = "0") @Min(0) int page,
                                                @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return service.listMine(page, size);
    }
}

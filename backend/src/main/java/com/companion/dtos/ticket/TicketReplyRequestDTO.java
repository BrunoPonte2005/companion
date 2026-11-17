package com.companion.dtos.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketReplyRequestDTO(
        @NotBlank(message = "A resposta é obrigatória")
        @Size(max = 2000, message = "A resposta deve ter no máximo 2000 caracteres") String response
) {
}

package com.companion.dtos.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TicketCreateRequestDTO(
        @NotBlank(message = "O assunto é obrigatório")
        @Size(max = 120, message = "O assunto deve ter no máximo 120 caracteres") String subject,
        @NotBlank(message = "A mensagem é obrigatória")
        @Size(max = 2000, message = "A mensagem deve ter no máximo 2000 caracteres") String message
) {
}

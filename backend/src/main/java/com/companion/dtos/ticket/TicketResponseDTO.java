package com.companion.dtos.ticket;

import com.companion.dtos.user.UserSummaryResponseDTO;
import com.companion.enums.TicketStatus;

import java.time.LocalDateTime;

public record TicketResponseDTO(
        Long id,
        UserSummaryResponseDTO author,
        String subject,
        String message,
        TicketStatus status,
        String response,
        UserSummaryResponseDTO respondedBy,
        LocalDateTime createdAt,
        LocalDateTime respondedAt,
        LocalDateTime closedAt
) {
}

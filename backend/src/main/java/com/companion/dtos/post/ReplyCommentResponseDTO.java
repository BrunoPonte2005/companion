package com.companion.dtos.post;

import com.companion.dtos.user.UserSummaryResponseDTO;

import java.time.LocalDateTime;

public record ReplyCommentResponseDTO(
        Long id,
        Long replyId,
        UserSummaryResponseDTO author,
        String content,
        LocalDateTime createdAt,
        boolean ownedByCurrentUser
) {
}

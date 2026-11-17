package com.companion.dtos.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplyCommentCreateRequestDTO(
        @NotBlank(message = "O comentário é obrigatório")
        @Size(max = 256, message = "O comentário deve ter no máximo 256 caracteres")
        String content
) {
}

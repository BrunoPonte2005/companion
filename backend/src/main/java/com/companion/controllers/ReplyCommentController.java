package com.companion.controllers;

import com.companion.dtos.post.ReplyCommentCreateRequestDTO;
import com.companion.dtos.post.ReplyCommentResponseDTO;
import com.companion.services.ReplyCommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/** Comentários dentro de uma resposta ({replyId} é o id da resposta). */
@Validated
@RestController
@RequestMapping("/api")
public class ReplyCommentController {
    private final ReplyCommentService service;

    public ReplyCommentController(ReplyCommentService service) {
        this.service = service;
    }

    @PostMapping("/replies/{replyId}/comments")
    public ResponseEntity<ReplyCommentResponseDTO> create(@PathVariable Long replyId,
                                                          @Valid @RequestBody ReplyCommentCreateRequestDTO request) {
        ReplyCommentResponseDTO response = service.create(replyId, request);
        return ResponseEntity.created(URI.create("/api/reply-comments/" + response.id())).body(response);
    }

    @GetMapping("/replies/{replyId}/comments")
    public List<ReplyCommentResponseDTO> list(@PathVariable Long replyId) {
        return service.list(replyId);
    }

    @DeleteMapping("/reply-comments/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

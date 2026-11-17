package com.companion.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Comentário feito dentro de uma resposta (PostComment), para complementar ou
 * esclarecer a informação dela. Fica numa tabela própria para que as
 * contagens de "respostas" de uma dúvida não misturem os dois níveis.
 */
@Entity
@Table(name = "reply_comments", indexes = {
        @Index(name = "idx_reply_comments_reply", columnList = "reply_id"),
        @Index(name = "idx_reply_comments_author", columnList = "author_id"),
        @Index(name = "idx_reply_comments_deleted_at", columnList = "deleted_at")
})
public class ReplyComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reply_id", nullable = false, foreignKey = @ForeignKey(name = "fk_reply_comments_reply"))
    private PostComment reply;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false, foreignKey = @ForeignKey(name = "fk_reply_comments_author"))
    private User author;

    @Column(nullable = false, length = 256)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    protected ReplyComment() { }

    public ReplyComment(PostComment reply, User author, String content) {
        this.reply = reply;
        this.author = author;
        this.content = content;
    }

    @PrePersist
    private void prePersist() { createdAt = LocalDateTime.now(); }

    public void delete() { if (deletedAt == null) deletedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public PostComment getReply() { return reply; }
    public User getAuthor() { return author; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
}

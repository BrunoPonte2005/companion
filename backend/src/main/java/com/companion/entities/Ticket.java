package com.companion.entities;

import com.companion.enums.TicketStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Pedido de suporte enviado por um usuário para a equipe da plataforma. */
@Entity
@Table(name = "tickets", indexes = {
        @Index(name = "idx_tickets_author_created", columnList = "author_id,created_at"),
        @Index(name = "idx_tickets_status_created", columnList = "status,created_at")
})
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false, foreignKey = @ForeignKey(name = "fk_tickets_author"))
    private User author;

    @Column(nullable = false, length = 120)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketStatus status;

    @Column(length = 2000)
    private String response;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by_id", foreignKey = @ForeignKey(name = "fk_tickets_responder"))
    private User respondedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    protected Ticket() { }

    public Ticket(User author, String subject, String message) {
        this.author = author;
        this.subject = subject;
        this.message = message;
        this.status = TicketStatus.OPEN;
    }

    @PrePersist
    private void prePersist() { createdAt = LocalDateTime.now(); }

    public void answer(User responder, String response) {
        this.respondedBy = responder;
        this.response = response;
        this.respondedAt = LocalDateTime.now();
        this.status = TicketStatus.ANSWERED;
    }

    public void close() {
        this.status = TicketStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getAuthor() { return author; }
    public String getSubject() { return subject; }
    public String getMessage() { return message; }
    public TicketStatus getStatus() { return status; }
    public String getResponse() { return response; }
    public User getRespondedBy() { return respondedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
}

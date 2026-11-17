package com.companion.repositories;

import com.companion.entities.Ticket;
import com.companion.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @EntityGraph(attributePaths = {"author", "respondedBy"})
    Optional<Ticket> findWithPeopleById(Long id);

    @EntityGraph(attributePaths = {"author", "respondedBy"})
    Page<Ticket> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "respondedBy"})
    Page<Ticket> findByStatusOrderByCreatedAtAsc(TicketStatus status, Pageable pageable);

    long countByAuthorIdAndStatus(Long authorId, TicketStatus status);
}

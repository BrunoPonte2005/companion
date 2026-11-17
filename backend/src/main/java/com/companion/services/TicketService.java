package com.companion.services;

import com.companion.dtos.common.PageResponse;
import com.companion.dtos.ticket.TicketCreateRequestDTO;
import com.companion.dtos.ticket.TicketReplyRequestDTO;
import com.companion.dtos.ticket.TicketResponseDTO;
import com.companion.entities.Ticket;
import com.companion.entities.User;
import com.companion.enums.TicketStatus;
import com.companion.enums.UserRole;
import com.companion.exceptions.ConflictException;
import com.companion.exceptions.ResourceNotFoundException;
import com.companion.repositories.TicketRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketService {

    /** Limite de tickets sem resposta por pessoa, para evitar spam. */
    static final int MAX_OPEN_TICKETS_PER_USER = 5;

    private final TicketRepository repository;
    private final UserService userService;
    private final AuthenticatedUserService authenticatedUserService;

    public TicketService(TicketRepository repository, UserService userService,
                         AuthenticatedUserService authenticatedUserService) {
        this.repository = repository;
        this.userService = userService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @Transactional
    public TicketResponseDTO create(TicketCreateRequestDTO request) {
        User author = authenticatedUserService.getCurrentUserWithCompleteProfile();
        if (repository.countByAuthorIdAndStatus(author.getId(), TicketStatus.OPEN) >= MAX_OPEN_TICKETS_PER_USER) {
            throw new ConflictException("Você já tem " + MAX_OPEN_TICKETS_PER_USER
                    + " tickets aguardando resposta. Aguarde o retorno da equipe antes de enviar outro");
        }
        Ticket ticket = repository.saveAndFlush(
                new Ticket(author, request.subject().trim(), request.message().trim()));
        return toResponse(ticket);
    }

    /** Tickets da própria conta, do mais novo para o mais antigo. */
    @Transactional(readOnly = true)
    public PageResponse<TicketResponseDTO> listMine(int page, int size) {
        User author = authenticatedUserService.getCurrentUser();
        return PageResponse.from(repository
                .findByAuthorIdOrderByCreatedAtDesc(author.getId(), PageRequest.of(page, Math.min(size, 100)))
                .map(this::toResponse));
    }

    /** Fila da administração: os mais antigos primeiro. */
    @Transactional(readOnly = true)
    public PageResponse<TicketResponseDTO> listForAdministration(TicketStatus status, int page, int size) {
        authenticatedUserService.requireAnyRole(UserRole.ADMIN);
        return PageResponse.from(repository
                .findByStatusOrderByCreatedAtAsc(status, PageRequest.of(page, Math.min(size, 100)))
                .map(this::toResponse));
    }

    @Transactional
    public TicketResponseDTO reply(Long id, TicketReplyRequestDTO request) {
        User responder = authenticatedUserService.requireAnyRole(UserRole.ADMIN);
        Ticket ticket = find(id);
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new ConflictException("Este ticket já foi respondido ou encerrado");
        }
        ticket.answer(responder, request.response().trim());
        return toResponse(repository.save(ticket));
    }

    @Transactional
    public TicketResponseDTO close(Long id) {
        authenticatedUserService.requireAnyRole(UserRole.ADMIN);
        Ticket ticket = find(id);
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new ConflictException("Este ticket já foi encerrado");
        }
        ticket.close();
        return toResponse(repository.save(ticket));
    }

    private Ticket find(Long id) {
        return repository.findWithPeopleById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado"));
    }

    private TicketResponseDTO toResponse(Ticket ticket) {
        return new TicketResponseDTO(ticket.getId(), userService.toSummary(ticket.getAuthor()),
                ticket.getSubject(), ticket.getMessage(), ticket.getStatus(), ticket.getResponse(),
                ticket.getRespondedBy() == null ? null : userService.toSummary(ticket.getRespondedBy()),
                ticket.getCreatedAt(), ticket.getRespondedAt(), ticket.getClosedAt());
    }
}

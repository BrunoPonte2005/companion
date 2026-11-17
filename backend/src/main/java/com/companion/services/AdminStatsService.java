package com.companion.services;

import com.companion.dtos.admin.AdminStatsResponseDTO;
import com.companion.enums.ReportStatus;
import com.companion.enums.UserStatus;
import com.companion.repositories.PostCommentRepository;
import com.companion.repositories.PostRepository;
import com.companion.repositories.ReportRepository;
import com.companion.repositories.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Estatísticas do painel de administração. A permissão (ADMIN) é exigida em
 * SecurityConfig, pois o endpoint fica sob /api/admin.
 */
@Service
public class AdminStatsService {

    private static final int TOP_SUBJECTS = 5;

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostCommentRepository commentRepository;
    private final ReportRepository reportRepository;

    public AdminStatsService(UserRepository userRepository, PostRepository postRepository,
                             PostCommentRepository commentRepository, ReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.reportRepository = reportRepository;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponseDTO getStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastWeek = now.minusDays(7);

        var users = new AdminStatsResponseDTO.Users(
                userRepository.countByStatusNot(UserStatus.DELETED),
                userRepository.countByStatus(UserStatus.SUSPENDED),
                userRepository.countByStatusNotAndCreatedAtGreaterThanEqual(UserStatus.DELETED, lastWeek),
                commentRepository.countDistinctAnswerers());

        var content = new AdminStatsResponseDTO.Content(
                postRepository.countByDeletedAtIsNull(),
                postRepository.countByDeletedAtIsNullAndCreatedAtGreaterThanEqual(lastWeek),
                postRepository.countActiveWithoutReplies(),
                commentRepository.countByDeletedAtIsNull());

        long pending = reportRepository.countByStatus(ReportStatus.PENDING);
        long resolved = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long dismissed = reportRepository.countByStatus(ReportStatus.DISMISSED);
        var reports = new AdminStatsResponseDTO.Reports(pending + resolved + dismissed, pending, resolved, dismissed);

        var topSubjects = postRepository
                .findTrendingSubjects(now.minusDays(30), PageRequest.of(0, TOP_SUBJECTS))
                .stream()
                .map(subject -> new AdminStatsResponseDTO.TopSubject(
                        subject.getCode(), subject.getName(), subject.getPostCount()))
                .toList();

        return new AdminStatsResponseDTO(users, content, reports, topSubjects);
    }
}

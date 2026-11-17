package com.companion.repositories;

import com.companion.entities.Report;
import com.companion.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByReporterIdAndPostId(Long reporterId, Long postId);
    boolean existsByReporterIdAndPostCommentId(Long reporterId, Long postCommentId);

    @Override
    @EntityGraph(attributePaths = {"reporter", "reviewedBy", "post", "postComment", "postComment.post"})
    Optional<Report> findById(Long id);

    @EntityGraph(attributePaths = {"reporter", "reviewedBy", "post", "postComment", "postComment.post"})
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "reviewedBy", "post", "postComment", "postComment.post"})
    Page<Report> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);

    // Sem paginação, para a exportação CSV.
    @EntityGraph(attributePaths = {"reporter", "reviewedBy", "post", "postComment", "postComment.post"})
    @Query("select r from Report r order by r.createdAt desc, r.id desc")
    List<Report> findAllForExport();

    @EntityGraph(attributePaths = {"reporter", "reviewedBy", "post", "postComment", "postComment.post"})
    @Query("select r from Report r where r.status = :status order by r.createdAt desc, r.id desc")
    List<Report> findAllForExportByStatus(@Param("status") ReportStatus status);

    long countByStatus(ReportStatus status);
}

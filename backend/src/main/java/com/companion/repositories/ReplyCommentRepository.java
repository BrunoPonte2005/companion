package com.companion.repositories;

import com.companion.entities.ReplyComment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReplyCommentRepository extends JpaRepository<ReplyComment, Long> {

    @EntityGraph(attributePaths = {"author", "reply", "reply.post"})
    Optional<ReplyComment> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"author", "reply"})
    List<ReplyComment> findByReplyIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long replyId);

    long countByReplyIdAndDeletedAtIsNull(Long replyId);

    @Query("""
            select rc.reply.id as replyId, count(rc) as total
            from ReplyComment rc
            where rc.deletedAt is null and rc.reply.id in :replyIds
            group by rc.reply.id
            """)
    List<ReplyCountProjection> countActiveByReplyIds(@Param("replyIds") Collection<Long> replyIds);
}

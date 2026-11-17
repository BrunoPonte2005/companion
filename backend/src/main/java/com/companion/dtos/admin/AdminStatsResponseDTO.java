package com.companion.dtos.admin;

import java.util.List;

/** Números do painel de administração. */
public record AdminStatsResponseDTO(
        Users users,
        Content content,
        Reports reports,
        List<TopSubject> topSubjects
) {
    /**
     * @param total            contas que não foram excluídas
     * @param suspended        contas suspensas
     * @param newLast7Days     contas criadas nos últimos 7 dias
     * @param answeredAtLeastOne pessoas que responderam ao menos uma dúvida de outra pessoa
     */
    public record Users(long total, long suspended, long newLast7Days, long answeredAtLeastOne) { }

    /**
     * @param posts            dúvidas publicadas (não apagadas)
     * @param postsLast7Days   dúvidas publicadas nos últimos 7 dias
     * @param withoutReplies   dúvidas ainda sem nenhuma resposta
     * @param replies          respostas publicadas (não apagadas)
     */
    public record Content(long posts, long postsLast7Days, long withoutReplies, long replies) { }

    public record Reports(long total, long pending, long resolved, long dismissed) { }

    /** Matérias com mais dúvidas nos últimos 30 dias. */
    public record TopSubject(String code, String name, long postCount) { }
}

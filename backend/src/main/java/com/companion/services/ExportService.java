package com.companion.services;

import com.companion.entities.Report;
import com.companion.entities.User;
import com.companion.enums.ReportStatus;
import com.companion.repositories.ReportRepository;
import com.companion.repositories.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Exportação de dados para a administração (CSV). A permissão (ADMIN) é
 * exigida em SecurityConfig, pois os endpoints ficam sob /api/admin.
 * Nunca exporta senha nem dados de autenticação.
 */
@Service
public class ExportService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;

    public ExportService(UserRepository userRepository, ReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
    }

    @Transactional(readOnly = true)
    public byte[] exportUsersCsv() {
        CsvBuilder csv = new CsvBuilder().row(
                "id", "email", "nome", "username", "matricula", "curso", "semestre",
                "perfil", "situacao", "email_verificado", "criado_em");
        List<User> users = userRepository.findAll(Sort.by("id"));
        for (User user : users) {
            csv.row(user.getId(), user.getEmail(), user.getName(), user.getUsername(),
                    user.getRegistrationNumber(),
                    user.getCourse() == null ? null : user.getCourse().getName(),
                    user.getSemester(), user.getRole(), user.getStatus(),
                    user.getEmailVerifiedAt() != null ? "sim" : "nao", user.getCreatedAt());
        }
        return csv.toBytes();
    }

    /** Todas as denúncias, ou só as da situação informada. */
    @Transactional(readOnly = true)
    public byte[] exportReportsCsv(ReportStatus status) {
        CsvBuilder csv = new CsvBuilder().row(
                "id", "situacao", "motivo", "tipo_alvo", "id_alvo", "id_duvida", "conteudo_denunciado",
                "detalhes", "denunciante", "analisado_por", "criada_em", "analisada_em");
        List<Report> reports = status == null
                ? reportRepository.findAllForExport()
                : reportRepository.findAllForExportByStatus(status);
        for (Report report : reports) {
            boolean postTarget = report.getPost() != null;
            csv.row(report.getId(), report.getStatus(), report.getReason(),
                    postTarget ? "POST" : "POST_COMMENT",
                    postTarget ? report.getPost().getId() : report.getPostComment().getId(),
                    postTarget ? report.getPost().getId() : report.getPostComment().getPost().getId(),
                    postTarget ? report.getPost().getTitle() : report.getPostComment().getContent(),
                    report.getDetails(), label(report.getReporter()), label(report.getReviewedBy()),
                    report.getCreatedAt(), report.getReviewedAt());
        }
        return csv.toBytes();
    }

    private static String label(User user) {
        if (user == null) return null;
        return user.getUsername() != null ? user.getUsername() : user.getEmail();
    }
}

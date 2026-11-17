package com.companion.controllers;

import com.companion.enums.ReportStatus;
import com.companion.services.ExportService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Exportação em CSV para a administração (acesso só de ADMIN, via SecurityConfig). */
@RestController
@RequestMapping("/api/admin/export")
public class AdminExportController {

    private static final MediaType CSV = MediaType.parseMediaType("text/csv;charset=UTF-8");

    private final ExportService exportService;

    public AdminExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping("/users.csv")
    public ResponseEntity<byte[]> users() {
        return csv("usuarios", exportService.exportUsersCsv());
    }

    @GetMapping("/reports.csv")
    public ResponseEntity<byte[]> reports(@RequestParam(required = false) ReportStatus status) {
        return csv("denuncias", exportService.exportReportsCsv(status));
    }

    private ResponseEntity<byte[]> csv(String name, byte[] content) {
        String filename = name + "-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .contentType(CSV)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(content);
    }
}

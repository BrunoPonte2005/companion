package com.companion.services;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Monta um arquivo CSV pensado para abrir direto no Excel em português:
 * separador ";", quebra de linha CRLF e BOM UTF-8 (para os acentos).
 *
 * Células de texto que começam com = + - @ (ou tab/CR) recebem um apóstrofo
 * na frente, para o Excel não executá-las como fórmula (CSV injection).
 */
public final class CsvBuilder {

    private static final String SEPARATOR = ";";
    private static final String NEW_LINE = "\r\n";
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final StringBuilder content = new StringBuilder();

    public CsvBuilder row(Object... cells) {
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) content.append(SEPARATOR);
            content.append(escape(cells[i]));
        }
        content.append(NEW_LINE);
        return this;
    }

    /** Conteúdo em UTF-8 com BOM. */
    public byte[] toBytes() {
        byte[] body = content.toString().getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[body.length + 3];
        result[0] = (byte) 0xEF;
        result[1] = (byte) 0xBB;
        result[2] = (byte) 0xBF;
        System.arraycopy(body, 0, result, 3, body.length);
        return result;
    }

    static String escape(Object value) {
        if (value == null) return "";
        if (value instanceof LocalDateTime dateTime) return DATE_TIME.format(dateTime);

        String text = value.toString();
        boolean isNumber = value instanceof Number;
        if (!isNumber && !text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) {
            text = "'" + text;
        }
        if (text.contains(SEPARATOR) || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }
}

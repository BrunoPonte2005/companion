package com.companion.services;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CsvBuilderTest {

    @Test
    void startsWithUtf8BomAndUsesSemicolonAndCrlf() {
        byte[] bytes = new CsvBuilder().row("id", "nome").row(1L, "Ana").toBytes();

        assertArrayEquals(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF},
                new byte[]{bytes[0], bytes[1], bytes[2]});
        assertEquals("id;nome\r\n1;Ana\r\n", new String(bytes, 3, bytes.length - 3, StandardCharsets.UTF_8));
    }

    @Test
    void quotesCellsWithSeparatorQuotesAndLineBreaks() {
        assertEquals("\"a;b\"", CsvBuilder.escape("a;b"));
        assertEquals("\"diz \"\"oi\"\"\"", CsvBuilder.escape("diz \"oi\""));
        assertEquals("\"linha1\nlinha2\"", CsvBuilder.escape("linha1\nlinha2"));
    }

    @Test
    void neutralizesSpreadsheetFormulasButKeepsNegativeNumbers() {
        assertEquals("'=SOMA(A1)", CsvBuilder.escape("=SOMA(A1)"));
        assertEquals("'+1", CsvBuilder.escape("+1"));
        assertEquals("'-1", CsvBuilder.escape("-1"));
        assertEquals("'@cmd", CsvBuilder.escape("@cmd"));
        assertEquals("-5", CsvBuilder.escape(-5));
    }

    @Test
    void formatsNullsAndDates() {
        assertEquals("", CsvBuilder.escape(null));
        assertEquals("2026-11-17 09:30:00", CsvBuilder.escape(LocalDateTime.of(2026, 11, 17, 9, 30)));
    }
}

package com.pharma.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pharma.model.Order;
import com.pharma.model.OrderItem;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderReceiptService {

    private final OrderService orderService;

    public byte[] generateReceipt(Long orderId) throws DocumentException, IOException {
        Order order = orderService.getOrderById(orderId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);

            document.open();

            // Header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Order Receipt", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("\n"));

            // Order Details
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            document.add(new Paragraph("Order ID: #" + order.getId(), normalFont));
            document.add(new Paragraph(
                    "Date: " + order.getOrderDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                    normalFont));
            document.add(new Paragraph(
                    "Customer: " + order.getUser().getFirstName() + " " + order.getUser().getLastName(), normalFont));
            document.add(new Paragraph("Shipping Address: " + order.getShippingAddress(), normalFont));
            document.add(new Paragraph("Payment Method: " + order.getPaymentMethod(), normalFont));
            document.add(new Paragraph("Payment Status: " + order.getPaymentStatus(), normalFont));
            document.add(new Paragraph("\n"));

            // Items Table
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 3, 2, 2, 2, 2 });

            addTableHeader(table, "Product");
            addTableHeader(table, "Price");
            addTableHeader(table, "Quantity");
            addTableHeader(table, "Free");
            addTableHeader(table, "Total");

            DecimalFormat df = new DecimalFormat("0.00");
            Font strikeFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, java.awt.Color.GRAY);
            
            for (OrderItem item : order.getOrderItems()) {
                table.addCell(item.getProduct().getName());
                table.addCell("$" + df.format(item.getPrice()));
                table.addCell(String.valueOf(item.getQuantity()));
                table.addCell(String.valueOf(item.getFreeQuantity()));
                
                PdfPCell totalCell = new PdfPCell();
                Phrase totalPhrase = new Phrase();
                
                java.math.BigDecimal subtotal = item.getSubtotal();
                java.math.BigDecimal originalUnitPrice = item.getProduct().getPrice();
                int totalQuantity = item.getQuantity();
                java.math.BigDecimal originalTotal = originalUnitPrice.multiply(java.math.BigDecimal.valueOf(totalQuantity));
                
                if (originalTotal.compareTo(subtotal) > 0) {
                    Chunk strikeChunk = new Chunk("$" + df.format(originalTotal), strikeFont);
                    strikeChunk.setUnderline(0.5f, 3.5f); // Strike-through effect
                    totalPhrase.add(strikeChunk);
                    totalPhrase.add(new Chunk("\n$" + df.format(subtotal), normalFont));
                } else {
                    totalPhrase.add(new Chunk("$" + df.format(subtotal), normalFont));
                }
                
                totalCell.setPhrase(totalPhrase);
                totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                table.addCell(totalCell);
            }

            document.add(table);

            // Total
            Paragraph total = new Paragraph("\nTotal Amount: $" + df.format(order.getTotalAmount()),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
            total.setAlignment(Element.ALIGN_RIGHT);
            document.add(total);

            document.close();
            return out.toByteArray();
        }
    }

    private void addTableHeader(PdfPTable table, String header) {
        PdfPCell cell = new PdfPCell();
        cell.setPhrase(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }
}

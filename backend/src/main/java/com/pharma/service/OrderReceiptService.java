package com.pharma.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.pharma.model.Order;
import com.pharma.model.OrderItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;

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
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[] { 4, 2, 2, 2 });

            addTableHeader(table, "Product");
            addTableHeader(table, "Price");
            addTableHeader(table, "Quantity");
            addTableHeader(table, "Total");

            DecimalFormat df = new DecimalFormat("0.00");
            for (OrderItem item : order.getOrderItems()) {
                table.addCell(item.getProduct().getName());
                table.addCell("$" + df.format(item.getPrice()));
                table.addCell(String.valueOf(item.getQuantity()));
                table.addCell(
                        "$" + df.format(item.getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()))));
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

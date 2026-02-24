package com.pharma;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharma.dto.request.CartItemRequest;
import com.pharma.dto.request.OrderRequest;
import com.pharma.dto.request.ProductRequest;
import com.pharma.model.User;
import com.pharma.model.enums.PaymentMethod;
import com.pharma.model.enums.ProductCategory;
import com.pharma.model.enums.Role;
import com.pharma.repository.UserRepository;

@SpringBootTest(properties = {
        "spring.mail.username=test@example.com",
        "app.email.admin-address=admin@example.com",
        "app.email.notifications.order-placed.enabled=false"
})
@AutoConfigureMockMvc
public class ProductBundleApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    public void setup() {
        if (!userRepository.existsByEmail("admin@example.com")) {
            User admin = new User();
            admin.setEmail("admin@example.com");
            admin.setPassword("password");
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    public void testProductBundleLifecycle() throws Exception {
        // 1. Create a bundle product
        ProductRequest productRequest = new ProductRequest();
        productRequest.setName("Bundle Test Product");
        productRequest.setDescription("A test product for bundles");
        productRequest.setPrice(BigDecimal.valueOf(10.0));
        productRequest.setStockQuantity(100);
        productRequest.setCategory(ProductCategory.PAIN_RELIEF);
        productRequest.setIsBundleOffer(true);
        productRequest.setBundleBuyQuantity(10);
        productRequest.setBundleFreeQuantity(2);
        productRequest.setBundlePrice(BigDecimal.valueOf(50.0));

        MvcResult productResult = mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isBundleOffer").value(true))
                .andReturn();

        String productResponse = productResult.getResponse().getContentAsString();
        Long productId = objectMapper.readTree(productResponse).path("data").path("id").asLong();

        // 2. Add product to cart
        CartItemRequest cartItemRequest = new CartItemRequest(productId, 12); // Full bundle (10+2)

        mockMvc.perform(post("/api/cart/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cartItemRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Checkout
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setShippingAddress("123 Test Street");
        orderRequest.setPaymentMethod(PaymentMethod.COD);

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalAmount").value(50.0))
                .andExpect(jsonPath("$.data.orderItems[0].freeQuantity").value(2));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    public void testProductBundleWithRemainder() throws Exception {
        // 1. Create a bundle product
        ProductRequest productRequest = new ProductRequest();
        productRequest.setName("Remainder Test Product");
        productRequest.setPrice(BigDecimal.valueOf(10.0));
        productRequest.setStockQuantity(100);
        productRequest.setCategory(ProductCategory.VITAMINS);
        productRequest.setIsBundleOffer(true);
        productRequest.setBundleBuyQuantity(10);
        productRequest.setBundleFreeQuantity(2);
        productRequest.setBundlePrice(BigDecimal.valueOf(50.0));

        MvcResult productResult = mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(productRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String productResponse = productResult.getResponse().getContentAsString();
        Long productId = objectMapper.readTree(productResponse).path("data").path("id").asLong();

        // 2. Clear cart first
        mockMvc.perform(delete("/api/cart/clear")).andExpect(status().isOk());

        // 3. Add 13 items (1 bundle + 1 remainder)
        CartItemRequest cartItemRequest = new CartItemRequest(productId, 13);
        mockMvc.perform(post("/api/cart/items")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(cartItemRequest)))
                .andExpect(status().isOk());

        // 4. Checkout
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setShippingAddress("123 Test Street");
        orderRequest.setPaymentMethod(PaymentMethod.COD);

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAmount").value(60.0)) // 50 (bundle) + 10 (remainder)
                .andExpect(jsonPath("$.data.orderItems[0].freeQuantity").value(2));
    }
}

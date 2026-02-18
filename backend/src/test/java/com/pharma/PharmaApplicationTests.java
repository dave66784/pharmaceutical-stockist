package com.pharma;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.mail.username=test@example.com",
        "app.email.admin-address=admin@example.com",
        "app.email.notifications.order-placed.enabled=false"
})
class PharmaApplicationTests {

    @org.springframework.boot.test.mock.mockito.MockBean
    private org.springframework.mail.javamail.JavaMailSender javaMailSender;

    @Test
    void contextLoads() {
    }

}

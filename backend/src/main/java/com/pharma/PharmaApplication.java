package com.pharma;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
public class PharmaApplication {
    public static void main(String[] args) {
        SpringApplication.run(PharmaApplication.class, args);
    }
}

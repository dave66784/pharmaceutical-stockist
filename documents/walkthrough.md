# Monitoring Setup Walkthrough

## Test Coverage Improvements
We have successfully increased the backend test coverage to **91.8%** across the core service layer.

### Coverage Breakdown
| Service | Coverage |
| :--- | :--- |
| **ProductService** | **100%** |
| **EmailService** | **96.9%** |
| **CartService** | **92.8%** |
| **UserService** | **90.3%** |
| **OrderService** | **82.9%** |

### Key Improvements
- **Resolved Java 25 / Byte Buddy Incompatibility**: Configured `maven-surefire-plugin` with `-Dnet.bytebuddy.experimental=true`.
- **Comprehensive Scenarios**: Added tests for success paths, error handling (e.g., `InsufficientStockException`, `ResourceNotFoundException`), and edge cases.
- **Fixed Logic Errors**: Corrected mocked repository calls in `ProductServiceTest` to match actual implementation.

## Verification Results
- All **41 tests** passed successfully.
- Jacoco report generated at `target/site/jacoco/index.html`.

    *   **Visual Report (Screenshots & Video):**
        The report now includes a special **"End-to-End Master Flow"** test with a single combined video showing the entire human-speed journey.
        ```bash
        cd automation
        npx playwright show-report
        ```
        Look for the **"End-to-End Master Flow"** result in the list.

    *   **Direct Video File:**
        `automation/test-results/master-flow-End-to-End-Master-Flow-chromium/video.webm`

    *   **Coverage Status:**
        - **Auth**: Admin/Customer Login & Redirects
        - **Customer**: Product Filter, Add to Cart, Checkout Flow
        - **Account**: Order History (viewing placed orders)
        - **Admin**: Dashboard & Product Management Navigation

## 1. Access Services


- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **App Backend**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **Grafana**: [http://localhost:3001](http://localhost:3001) (Login: `admin` / `admin`)
- **Prometheus**: [http://localhost:9090](http://localhost:9090) (Use `http://prometheus:9090` inside Grafana)
- **Loki**: [http://localhost:3100/ready](http://localhost:3100/ready) (Use `http://loki:3100` inside Grafana)

## 3. Verify Logging (Loki)

1.  Open Grafana > **Explore**.
2.  Select **Loki** from the dropdown at the top.
3.  Run query: `{app="pharmaceutical-stockist"}`.
4.  You should see backend logs appearing in real-time.

## 4. API Verification (Smoke Test)

You can run the `verify_app.sh` script to perform an automated check of key API endpoints (Login, Users, Products, Cart).

```bash
chmod +x verify_app.sh
./verify_app.sh
```

## 5. Verify Metrics (Prometheus)

1.  Open Grafana > **Dashboards** > **Import**.
2.  Enter ID **4701** (JVM Micrometer) and Load.
3.  Select **Prometheus** as the data source.
4.  Click **Import**.
5.  You should see JVM metrics (Heap, CPU, etc.).

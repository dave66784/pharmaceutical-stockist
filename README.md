# Pharmaceutical Stockist E-Commerce Platform

A full-stack e-commerce web application for a pharmaceutical stockist built with Spring Boot 3.2 (Java 21) and React 18 (Node 24).

## 🚀 Technology Stack

### Backend
- **Spring Boot 3.2.0** with Java 21
- **Spring Security 6** with JWT authentication
- **Spring Data JPA** with Hibernate
- **PostgreSQL 16** database
- **Maven** for build management
- **Swagger/OpenAPI** for API documentation

### Frontend
- **React 18.3** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Axios** for HTTP requests
- **React Router v6** for navigation

## 📋 Features

### Customer Features
- User registration and authentication
- Browse products with search and filters
- Product categories and details
- Shopping cart management
- Order placement and tracking
- Order history

### Admin Features
- Product management (CRUD operations)
- Inventory management
- Order management and status updates
- User management
- Dashboard with statistics

## 🛠️ Prerequisites

- **Java 21** or higher
- **Node.js 24** or higher
- **PostgreSQL 16** or higher
- **Maven 3.9+** (or use Maven wrapper)
- **Docker & Docker Compose** (optional, for containerized deployment)

## 📦 Installation & Setup

### Option 1: Manual Setup

#### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE pharma_db;
```

#### 2. Backend Setup

```bash
cd backend

# Update application.properties with your database credentials
# The file is located at: src/main/resources/application.properties

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend will start at `http://localhost:8080`

API Documentation (Swagger): `http://localhost:8080/swagger-ui.html`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at `http://localhost:3000`

### Option 2: Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Services:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Database: `localhost:5432`

To stop services:
```bash
docker-compose down
```

## 🗄️ Database Schema

The application uses the following main entities:

- **User**: User accounts (customers and admins)
- **Product**: Product catalog
- **Cart**: Shopping carts
- **CartItem**: Items in shopping carts
- **Order**: Customer orders
- **OrderItem**: Items in orders

## 🔐 Default Admin Account

After first run, you can create an admin account by:

1. Register a new user through the API or UI
2. Manually update the user role in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Products (Public)
- `GET /api/products` - Get all products (paginated)
- `GET /api/products/{id}` - Get product by ID
- `GET /api/products/search?query=` - Search products
- `GET /api/products/category/{category}` - Get products by category

### Products (Admin Only)
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Cart (Authenticated)
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/{itemId}` - Update cart item
- `DELETE /api/cart/items/{itemId}` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders (Authenticated)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/{id}` - Get order by ID

### Admin
- `GET /api/admin/orders` - Get all orders (paginated)
- `GET /api/admin/orders/status/{status}` - Get orders by status
- `PUT /api/admin/orders/{orderId}/status` - Update order status

## 🧪 Testing

### Backend Tests
```bash
cd backend
mvn test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🏗️ Project Structure

```
pharmaceutical-stockist/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/pharma/
│   │   │   │   ├── config/         # Configuration classes
│   │   │   │   ├── controller/     # REST controllers
│   │   │   │   ├── dto/            # Data Transfer Objects
│   │   │   │   ├── exception/      # Exception handlers
│   │   │   │   ├── model/          # JPA entities
│   │   │   │   ├── repository/     # JPA repositories
│   │   │   │   ├── security/       # Security configuration
│   │   │   │   └── service/        # Business logic
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

## 🔧 Configuration

### Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/pharma_db
spring.datasource.username=postgres
spring.datasource.password=postgres

# JWT
jwt.secret=your-secret-key-here
jwt.expiration=86400000
```

### Frontend Configuration

The frontend proxies API requests to the backend. Update `frontend/vite.config.ts` if needed.

## 📝 Environment Variables

### Backend
- `SPRING_DATASOURCE_URL` - Database URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRATION` - JWT expiration time in milliseconds

## 🚢 Production Deployment

1. Update `application.properties` for production:
   - Set `spring.jpa.hibernate.ddl-auto=validate`
   - Use environment variables for sensitive data
   - Configure proper CORS origins

2. Build production artifacts:
```bash
# Backend
cd backend
mvn clean package -DskipTests

# Frontend
cd frontend
npm run build
```

3. Deploy using Docker:
```bash
docker-compose up -d
```

## 🔒 Security Features

- Password hashing with BCrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation
- XSS protection
- CORS configuration
- SQL injection prevention

## 📚 API Documentation

After starting the backend, visit:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `application.properties`
- Verify database name exists

### Port Already in Use
- Backend: Change port in `application.properties`: `server.port=8081`
- Frontend: Change port in `vite.config.ts`: `port: 3001`

### CORS Errors
- Update `CorsConfig.java` to include your frontend URL

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.

## 🎯 Future Enhancements

- [ ] Email notifications
- [ ] Payment gateway integration
- [ ] Prescription upload and verification
- [ ] Product reviews and ratings
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app

---

Built with ❤️ using Spring Boot 3.2 (Java 21) and React 18 (Node 24)

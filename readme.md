# 🧠 Productivity App – System Documentation

This document provides a comprehensive overview of the technologies used and a series of technical diagrams to illustrate the architecture, flow, and structure of the application.

---

## 🛠 Technologies and Frameworks Used

### 🔹 Frontend

- **Next.js** (React framework)
- **TypeScript**
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components

### 🔹 Authentication & Authorization

- **NextAuth.js**
- **JWT (JSON Web Tokens)**
- **MongoDB** for user data

### 🔹 State Management

- **React Context API**
- **Custom hooks** (language and task context)

### 🔹 UI Components

- **Lucide React** for icons
- **Radix UI** for accessibility
- **Toast notifications system**

### 🔹 Database

- **MongoDB**
- **Mongoose** for object modeling

### 🔹 API

- **Next.js API Routes**
- RESTful API Design

### 🔹 Internationalization

- **Custom language context**
- Support for English and French

### 🔹 Styling

- **Tailwind CSS**
- **CSS Modules**
- **Responsive Design**

---

## 📊 System Diagrams

### ✅ Use Case Diagram

```mermaid
graph TD
    User[User] --> Login[Login to System]
    User --> ViewTasks[View Tasks]
    User --> ManageTasks[Manage Tasks]
    User --> ViewPerformance[View Performance]
    User --> ManageFiles[Manage Files]
    User --> ViewOrders[View Orders]
    User --> ManageOrders[Manage Orders]

    Admin[Administrator] --> ManageUsers[Manage Users]
    Admin --> ViewAllTasks[View All Tasks]
    Admin --> ViewAllPerformance[View All Performance]
    Admin --> ManageSystem[Manage System Settings]
    Admin --> ViewAllOrders[View All Orders]
    Admin --> ManageAllOrders[Manage All Orders]

    Login --> Authentication[Authentication System]
    ManageTasks --> TaskManagement[Task Management System]
    ViewPerformance --> PerformanceTracking[Performance Tracking System]
    ManageFiles --> FileManagement[File Management System]
    ManageUsers --> UserManagement[User Management System]
    ManageOrders --> OrderManagement[Order Management System]
```

---

### 🔗 Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ TASK : creates
    USER ||--o{ PERFORMANCE : has
    USER ||--o{ FILE : uploads
    USER ||--o{ ORDER : creates
    USER {
        string id PK
        string name
        string email
        string password
        string role
        string profilePicture
    }
    TASK {
        string id PK
        string title
        string description
        date dueDate
        string status
        string priority
        string userId FK
    }
    PERFORMANCE {
        string id PK
        string userId FK
        number completedTasks
        number totalTasks
        date date
    }
    FILE {
        string id PK
        string name
        string type
        string url
        string userId FK
        date uploadDate
    }
    ORDER {
        string id PK
        string orderNumber
        string project
        string requester
        string description
        string category
        string status
        date deadline
        number totalPrice
        string pam
        string supplier
        string requestFrame
        string process
        boolean done
        date orderCreationDate
        string userId FK
    }
```

---

### 🧱 Class Diagram

```mermaid
classDiagram
    class User {
        +string id
        +string name
        +string email
        +string role
        +string profilePicture
        +createTask()
        +viewTasks()
        +updateProfile()
        +createOrder()
        +viewOrders()
    }

    class Task {
        +string id
        +string title
        +string description
        +date dueDate
        +string status
        +string priority
        +updateStatus()
        +assignToUser()
    }

    class Order {
        +string id
        +string orderNumber
        +string project
        +string requester
        +string description
        +string category
        +string status
        +date deadline
        +number totalPrice
        +string process
        +boolean done
        +updateStatus()
        +markAsDone()
        +updateProcess()
    }

    class Performance {
        +string id
        +number completedTasks
        +number totalTasks
        +date date
        +calculateMetrics()
    }

    class File {
        +string id
        +string name
        +string type
        +string url
        +date uploadDate
        +upload()
        +download()
    }

    User "1" -- "many" Task
    User "1" -- "many" Performance
    User "1" -- "many" File
    User "1" -- "many" Order
```

---

### 🔁 Activity Diagram

```mermaid
graph TD
    Start[Start] --> Login[Login]
    Login --> Validate[Validate Credentials]
    Validate -->|Valid| Dashboard[Dashboard]
    Validate -->|Invalid| Error[Show Error]
    Error --> Login

    Dashboard -->|View Tasks| TaskList[View Task List]
    Dashboard -->|Create Task| CreateTask[Create New Task]
    Dashboard -->|View Performance| Performance[View Performance]
    Dashboard -->|View Orders| OrderList[View Order List]
    Dashboard -->|Create Order| CreateOrder[Create New Order]

    TaskList -->|Edit| EditTask[Edit Task]
    TaskList -->|Delete| DeleteTask[Delete Task]
    CreateTask --> SaveTask[Save Task]
    EditTask --> SaveTask
    SaveTask --> Dashboard

    OrderList -->|Edit| EditOrder[Edit Order]
    OrderList -->|Delete| DeleteOrder[Delete Order]
    OrderList -->|Mark Done| MarkOrderDone[Mark Order as Done]
    CreateOrder --> SaveOrder[Save Order]
    EditOrder --> SaveOrder
    SaveOrder --> Dashboard

    Performance -->|Filter| FilterPerformance[Filter Performance Data]
    FilterPerformance --> Performance
```

---

### 🧩 Component Diagram

```mermaid
graph TD
    App[App Component] --> Layout[Layout Component]
    Layout --> Nav[DashboardNav]
    Layout --> Sidebar[DashboardSidebar]
    Layout --> Main[Main Content]

    Nav --> LanguageToggle[Language Toggle]
    Nav --> ThemeToggle[Theme Toggle]
    Nav --> UserMenu[User Menu]

    Main --> Dashboard[Dashboard]
    Main --> Tasks[Tasks]
    Main --> Performance[Performance]
    Main --> Files[Files]
    Main --> Orders[Orders]

    Dashboard --> PerformanceDashboard[Performance Dashboard]
    Dashboard --> UserDashboard[User Dashboard]

    Tasks --> TaskList[Task List]
    Tasks --> TaskForm[Task Form]

    Orders --> OrderTable[Order Table]
    Orders --> OrderForm[Order Form]
    Orders --> OrderDetails[Order Details]

    Performance --> Metrics[Metrics]
    Performance --> Charts[Charts]

    Files --> FileList[File List]
    Files --> UploadForm[Upload Form]
```

---

### 📦 Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant DB

    User->>UI: Enter credentials
    UI->>API: POST /api/auth/login
    API->>DB: Query user
    DB-->>API: Return user data
    API-->>UI: Return JWT token
    UI->>User: Show dashboard

    User->>UI: Create new order
    UI->>API: POST /api/orders
    API->>DB: Generate order number
    API->>DB: Save order
    DB-->>API: Confirm save
    API-->>UI: Return success
    UI->>User: Show updated order list

    User->>UI: Update order status
    UI->>API: PUT /api/orders/:id
    API->>DB: Update order
    DB-->>API: Confirm update
    API-->>UI: Return success
    UI->>User: Show updated order

    User->>UI: View performance
    UI->>API: GET /api/performance
    API->>DB: Query performance data
    DB-->>API: Return performance data
    API-->>UI: Return formatted data
    UI->>User: Display performance metrics
```

---

## 🧭 Additional System Diagrams

### 🔄 State Diagram

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticated: Login
    Authenticated --> Unauthenticated: Logout

    Authenticated --> TaskManagement: View Tasks
    TaskManagement --> TaskCreation: Create Task
    TaskManagement --> TaskEditing: Edit Task
    TaskManagement --> TaskDeletion: Delete Task

    Authenticated --> OrderManagement: View Orders
    OrderManagement --> OrderCreation: Create Order
    OrderManagement --> OrderEditing: Edit Order
    OrderManagement --> OrderDeletion: Delete Order
    OrderManagement --> OrderStatusUpdate: Update Status

    Authenticated --> PerformanceView: View Performance
    PerformanceView --> FilteredView: Apply Filters

    Authenticated --> FileManagement: Manage Files
    FileManagement --> FileUpload: Upload File
    FileManagement --> FileDownload: Download File

    state Authenticated {
        [*] --> Dashboard
        Dashboard --> Settings
        Settings --> Dashboard
    }
```

---

### 🌍 Deployment Diagram

```mermaid
graph TD
    Client[Client Browser] --> NextJS[Next.js Server]
    NextJS --> Auth[Auth Service]
    NextJS --> API[API Routes]
    API --> MongoDB[(MongoDB Database)]

    subgraph Frontend
        Client
    end

    subgraph Backend
        NextJS
        Auth
        API
    end

    subgraph Database
        MongoDB
    end
```

---

### 📦 Package Diagram

```mermaid
graph TD
    App[App Package] --> Components[Components Package]
    App --> Contexts[Contexts Package]
    App --> API[API Package]
    App --> Utils[Utils Package]

    Components --> UI[UI Components]
    Components --> Layout[Layout Components]
    Components --> Features[Feature Components]
    Components --> Orders[Order Components]

    Contexts --> Auth[Auth Context]
    Contexts --> Language[Language Context]
    Contexts --> Task[Task Context]
    Contexts --> Order[Order Context]

    API --> Auth[Auth Routes]
    API --> Tasks[Task Routes]
    API --> Orders[Order Routes]
    API --> Performance[Performance Routes]
    API --> Files[File Routes]
```

---

### 🔐 Security Diagram

```mermaid
graph TD
    User[User] --> Auth[Authentication]
    Auth --> JWT[JWT Token]
    JWT --> API[API Routes]

    API --> RBAC[Role-Based Access Control]
    RBAC --> Admin[Admin Access]
    RBAC --> User[User Access]

    Admin --> FullAccess[Full System Access]
    User --> LimitedAccess[Limited Access]

    API --> RateLimit[Rate Limiting]
    API --> InputValidation[Input Validation]
    API --> DataSanitization[Data Sanitization]
```

---

## 📥 Contribution

Want to contribute or suggest a diagram enhancement? Feel free to open an issue or pull request.

---

Would you like this in a downloadable `.md` file format or directly added to your project repository?

# نظام إدارة صالون تجميل الأظافر

## نظرة عامة
نظام متكامل لإدارة صالون تجميل الأظافر يتيح إدارة المواعيد، الخدمات، والعملاء. يدعم النظام ثلاثة أنواع من المستخدمين: الإدارة، المصممين، والعملاء.

## المميزات الرئيسية
- نظام تسجيل دخول متعدد المستويات (إدارة، مصممين، عملاء)
- إدارة المواعيد وحجزها
- إدارة الخدمات والأسعار
- لوحة تحكم خاصة لكل نوع من المستخدمين
- واجهة مستخدم سهلة الاستخدام

## المتطلبات التقنية
- Node.js
- SQLite
- Express.js

## المكتبات المستخدمة
### Node.js
- express
- sqlite3
- pug
- express-session
- connect-flash

## طريقة التثبيت
1. قم بتثبيت Node.js
2. قم بتنزيل المشروع
3. قم بتثبيت الاعتمادات:
```bash
npm install
```
4. قم بتشغيل الخادم:
```bash
npm start
```

## هيكل المشروع
```
SalonManagement/
│
├── .git/                      # Git repository
├── attached_assets/           # Additional assets
├── config/                    # Configuration files
│   ├── database.js            # Database configuration
│   └── auth.js                # Authentication configuration
│
├── controllers/               # Controller files
│   ├── authController.js      # Authentication logic
│   ├── adminController.js     # Admin functionality
│   ├── manicuristController.js # Manicurist functionality
│   ├── clientController.js    # Client functionality
│   ├── serviceController.js   # Service management
│   └── appointmentController.js # Appointment handling
│
├── data/                      # Data storage
│
├── middleware/                # Middleware functions
│   ├── authMiddleware.js      # Authentication middleware
│   └── errorMiddleware.js     # Error handling middleware
│
├── models/                    # Data models
│   ├── User.js                # User model
│   ├── Service.js             # Service model
│   └── Appointment.js         # Appointment model
│
├── public/                    # Static files
│   ├── css/                   # CSS files
│   ├── js/                    # JavaScript files
│   └── images/                # Image files
│
├── routes/                    # Route definitions
│   ├── authRoutes.js          # Authentication routes
│   ├── adminRoutes.js         # Admin routes
│   ├── manicuristRoutes.js    # Manicurist routes
│   ├── clientRoutes.js        # Client routes
│   ├── serviceRoutes.js       # Service routes
│   └── appointmentRoutes.js   # Appointment routes
│
├── views/
│
├── admin/                     # Admin views
│   ├── dashboard.pug          # Admin dashboard
│   ├── clients.pug            # Client management
│   ├── editClient.pug         # Edit client details
│   ├── services.pug           # Service management
│   └── manicurists.pug        # Manicurist management
│
├── services/                  # Service views
│   ├── catalog.pug            # Service catalog
│   └── details.pug            # Service details
│
├── manicurist/                # Manicurist views
│   ├── dashboard.pug          # Manicurist dashboard
│   ├── appointments.pug       # Manicurist appointments
│   └── profile.pug            # Manicurist profile
│
├── layouts/                   # Layout templates
│   └── main.pug               # Main layout
│
├── client/                    # Client views
│   ├── dashboard.pug          # Client dashboard
│   ├── history.pug            # Client history
│   └── profile.pug            # Client profile
│
├── auth/                      # Authentication views
│   ├── login.pug              # Login page
│   └── register.pug           # Registration page
│
├── appointments/              # Appointment views
│   ├── book.pug               # Book appointment
│   ├── list.pug               # List appointments
│   └── details.pug            # Appointment details
│
├── index.pug                  # Home page
└── error.pug                  # Error page
 
files
│
├── app.js                     # Main application file
├── app-launcher.js            # Application launcher
├── package.json               # Project dependencies
├── package-lock.json          # Locked dependencies
├── pyproject.toml             # Python project configuration
├── README.md                  # Project documentation
└── README.ru.md               # Russian documentation
```

## المسارات الرئيسية
### مسارات المصادقة
- `/login` - تسجيل الدخول
- `/register` - إنشاء حساب جديد
- `/logout` - تسجيل الخروج

### مسارات الإدارة
- `/admin/dashboard` - لوحة تحكم الإدارة
- `/admin/manicurists` - إدارة المصممين
- `/admin/services` - إدارة الخدمات

### مسارات المصممين
- `/manicurist/dashboard` - لوحة تحكم المصمم
- `/manicurist/appointments` - إدارة المواعيد
- `/manicurist/profile` - الملف الشخصي

### مسارات العملاء
- `/client/dashboard` - لوحة تحكم العميل
- `/client/history` - سجل المواعيد
- `/client/profile` - الملف الشخصي

## الأمان
- تشفير كلمات المرور باستخدام SHA-256
- حماية المسارات باستخدام middleware
- جلسات آمنة
- التحقق من الصلاحيات

## المساهمة
نرحب بمساهماتكم في تطوير المشروع. يرجى اتباع الخطوات التالية:
1. قم بعمل fork للمشروع
2. قم بإنشاء فرع جديد
3. قم بإجراء التغييرات
4. قم بإنشاء pull request


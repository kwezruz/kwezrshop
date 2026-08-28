<?php
require_once '../config.php';

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

// Statistika
$stats = [];

// Umumiy foydalanuvchilar
$stmt = $pdo->query("SELECT COUNT(*) FROM users");
$stats['total_users'] = $stmt->fetchColumn();

// Bugungi foydalanuvchilar
$stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()");
$stats['today_users'] = $stmt->fetchColumn();

// Umumiy buyurtmalar
$stmt = $pdo->query("SELECT COUNT(*) FROM orders");
$stats['total_orders'] = $stmt->fetchColumn();

// Bugungi buyurtmalar
$stmt = $pdo->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()");
$stats['today_orders'] = $stmt->fetchColumn();

// Umumiy aylanma
$stmt = $pdo->query("SELECT SUM(price) FROM orders WHERE status = 'completed'");
$stats['total_revenue'] = $stmt->fetchColumn() ?: 0;

// Bugungi aylanma
$stmt = $pdo->query("SELECT SUM(price) FROM orders WHERE DATE(created_at) = CURDATE() AND status = 'completed'");
$stats['today_revenue'] = $stmt->fetchColumn() ?: 0;

// Kutayotgan buyurtmalar
$stmt = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
$stats['pending_orders'] = $stmt->fetchColumn();

$page = $_GET['page'] ?? 'dashboard';
?>
<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - ELDER STARS</title>
    <link rel="stylesheet" href="../assets/css/admin-style.css">
</head>
<body>
    <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#3498db"/>
                </svg>
                <span>ELDER STARS</span>
            </div>
            
            <button class="menu-toggle" onclick="toggleSidebar()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            
            <nav class="sidebar-nav">
                <a href="?page=dashboard" class="nav-item <?php echo $page === 'dashboard' ? 'active' : ''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
                    </svg>
                    <span>Bosh sahifa</span>
                </a>
                <a href="?page=users" class="nav-item <?php echo $page === 'users' ? 'active' : ''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                    </svg>
                    <span>Foydalanuvchilar</span>
                </a>
                <a href="?page=orders" class="nav-item <?php echo $page === 'orders' ? 'active' : ''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor"/>
                    </svg>
                    <span>Buyurtmalar</span>
                </a>
                <a href="?page=api" class="nav-item <?php echo $page === 'api' ? 'active' : ''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M20 18C20 18.55 19.55 19 19 19H5C4.45 19 4 18.55 4 18V6C4 5.45 4.45 5 5 5H19C19.55 5 20 5.45 20 6V18M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6M9 9V11H15V9H9M9 13V15H13V13H9Z" fill="currentColor"/>
                    </svg>
                    <span>API</span>
                </a>
                <a href="?page=services" class="nav-item <?php echo $page === 'services' ? 'active' : ''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19.14 12.94C19.16 12.78 19.17 12.62 19.17 12.46C19.17 12.3 19.16 12.14 19.14 11.98L21.16 10.38C21.34 10.24 21.39 9.99 21.28 9.79L19.38 6.49C19.27 6.3 19.03 6.22 18.83 6.29L16.46 7.24C15.97 6.86 15.44 6.54 14.87 6.28L14.51 3.75C14.48 3.53 14.29 3.36 14.07 3.36H10.27C10.05 3.36 9.86 3.53 9.83 3.75L9.47 6.28C8.9 6.54 8.37 6.86 7.88 7.24L5.51 6.29C5.31 6.21 5.07 6.3 4.96 6.49L3.06 9.79C2.95 9.99 3 10.24 3.18 10.38L5.2 11.98C5.18 12.14 5.17 12.3 5.17 12.46C5.17 12.62 5.18 12.78 5.2 12.94L3.18 14.54C3 14.68 2.95 14.93 3.06 15.13L4.96 18.43C5.07 18.62 5.31 18.7 5.51 18.63L7.88 17.68C8.37 18.06 8.9 18.38 9.47 18.64L9.83 21.17C9.86 21.39 10.05 21.56 10.27 21.56H14.07C14.29 21.56 14.48 21.39 14.51 21.17L14.87 18.64C15.44 18.38 15.97 18.06 16.46 17.68L18.83 18.63C19.03 18.71 19.27 18.62 19.38 18.43L21.28 15.13C21.39 14.93 21.34 14.68 21.16 14.54L19.14 12.94M12.17 15.11C10.76 15.11 9.61 13.96 9.61 12.55C9.61 11.14 10.76 9.99 12.17 9.99C13.58 9.99 14.73 11.14 14.73 12.55C14.73 13.96 13.58 15.11 12.17 15.11Z" fill="currentColor"/>
                    </svg>
                    <span>Xizmatlar</span>
                </a>
                <a href="?page=settings" class="nav-item <?php echo $page === 'settings' ? 'active' : ''; ?>">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19.14 12.94C19.16 12.78 19.17 12.62 19.17 12.46C19.17 12.3 19.16 12.14 19.14 11.98L21.16 10.38C21.34 10.24 21.39 9.99 21.28 9.79L19.38 6.49C19.27 6.3 19.03 6.22 18.83 6.29L16.46 7.24C15.97 6.86 15.44 6.54 14.87 6.28L14.51 3.75C14.48 3.53 14.29 3.36 14.07 3.36H10.27C10.05 3.36 9.86 3.53 9.83 3.75L9.47 6.28C8.9 6.54 8.37 6.86 7.88 7.24L5.51 6.29C5.31 6.21 5.07 6.3 4.96 6.49L3.06 9.79C2.95 9.99 3 10.24 3.18 10.38L5.2 11.98C5.18 12.14 5.17 12.3 5.17 12.46C5.17 12.62 5.18 12.78 5.2 12.94L3.18 14.54C3 14.68 2.95 14.93 3.06 15.13L4.96 18.43C5.07 18.62 5.31 18.7 5.51 18.63L7.88 17.68C8.37 18.06 8.9 18.38 9.47 18.64L9.83 21.17C9.86 21.39 10.05 21.56 10.27 21.56H14.07C14.29 21.56 14.48 21.39 14.51 21.17L14.87 18.64C15.44 18.38 15.97 18.06 16.46 17.68L18.83 18.63C19.03 18.71 19.27 18.62 19.38 18.43L21.28 15.13C21.39 14.93 21.34 14.68 21.16 14.54L19.14 12.94M12.17 15.11C10.76 15.11 9.61 13.96 9.61 12.55C9.61 11.14 10.76 9.99 12.17 9.99C13.58 9.99 14.73 11.14 14.73 12.55C14.73 13.96 13.58 15.11 12.17 15.11Z" fill="currentColor"/>
                    </svg>
                    <span>Sozlamalar</span>
                </a>
                <a href="logout.php" class="nav-item nav-logout">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M16 17L21 12L16 7M21 12H9M13 21H6C4.9 21 4 20.1 4 19V5C4 3.9 4.9 3 6 3H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Chiqish</span>
                </a>
            </nav>
        </aside>
        
        <!-- Main Content -->
        <main class="main-content">
            <?php
            switch($page) {
                case 'dashboard':
                    include 'pages/dashboard.php';
                    break;
                case 'users':
                    include 'pages/users.php';
                    break;
                case 'orders':
                    include 'pages/orders.php';
                    break;
                case 'api':
                    include 'pages/api.php';
                    break;
                case 'services':
                    include 'pages/services.php';
                    break;
                case 'settings':
                    include 'pages/settings.php';
                    break;
                default:
                    include 'pages/dashboard.php';
            }
            ?>
        </main>
    </div>
    
    <script src="../assets/js/admin.js"></script>
</body>
</html>
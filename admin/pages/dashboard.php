<div class="page-header">
    <h1>Bosh sahifa</h1>
    <p>Xush kelibsiz, <?php echo htmlspecialchars($_SESSION['admin_username']); ?>!</p>
</div>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
        </div>
        <div class="stat-content">
            <div class="stat-value"><?php echo $stats['total_users']; ?></div>
            <div class="stat-label">Umumiy foydalanuvchilar</div>
        </div>
        <div class="stat-change">+<?php echo $stats['today_users']; ?> bugun</div>
    </div>
    
    <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" fill="currentColor"/>
            </svg>
        </div>
        <div class="stat-content">
            <div class="stat-value"><?php echo $stats['total_orders']; ?></div>
            <div class="stat-label">Umumiy buyurtmalar</div>
        </div>
        <div class="stat-change">+<?php echo $stats['today_orders']; ?> bugun</div>
    </div>
    
    <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>
            </svg>
        </div>
        <div class="stat-content">
            <div class="stat-value"><?php echo number_format($stats['total_revenue'], 0, '.', ' '); ?></div>
            <div class="stat-label">Umumiy aylanma (so'm)</div>
        </div>
        <div class="stat-change">+<?php echo number_format($stats['today_revenue'], 0, '.', ' '); ?> bugun</div>
    </div>
    
    <div class="stat-card stat-warning">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <div class="stat-content">
            <div class="stat-value"><?php echo $stats['pending_orders']; ?></div>
            <div class="stat-label">Kutilayotgan buyurtmalar</div>
        </div>
    </div>
</div>

<div class="recent-orders">
    <h2>Oxirgi buyurtmalar</h2>
    <div class="table-container">
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Foydalanuvchi</th>
                    <th>Xizmat</th>
                    <th>Miqdor</th>
                    <th>Narx</th>
                    <th>Holat</th>
                    <th>Sana</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $stmt = $pdo->query("SELECT o.*, u.username, u.first_name, s.name as service_name FROM orders o LEFT JOIN users u ON o.user_id = u.id LEFT JOIN services s ON o.service_id = s.id ORDER BY o.created_at DESC LIMIT 10");
                $orders = $stmt->fetchAll();
                
                foreach ($orders as $order):
                    $statusClass = [
                        'pending' => 'status-pending',
                        'processing' => 'status-processing',
                        'completed' => 'status-completed',
                        'cancelled' => 'status-cancelled'
                    ][$order['status']];
                    
                    $statusText = [
                        'pending' => '⏳ Kutmoqda',
                        'processing' => '🔄 Jarayonda',
                        'completed' => '✅ Bajarildi',
                        'cancelled' => '❌ Bekor qilindi'
                    ][$order['status']];
                ?>
                <tr>
                    <td>#<?php echo $order['id']; ?></td>
                    <td><?php echo htmlspecialchars($order['username'] ?: $order['first_name']); ?></td>
                    <td><?php echo htmlspecialchars($order['service_name']); ?></td>
                    <td><?php echo $order['quantity']; ?></td>
                    <td><?php echo formatPrice($order['price']); ?></td>
                    <td><span class="status-badge <?php echo $statusClass; ?>"><?php echo $statusText; ?></span></td>
                    <td><?php echo date('d.m.Y H:i', strtotime($order['created_at'])); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
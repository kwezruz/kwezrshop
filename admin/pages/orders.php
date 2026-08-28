<?php
$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? 'all';

$query = "SELECT o.*, u.username, u.first_name, s.name as service_name FROM orders o LEFT JOIN users u ON o.user_id = u.id LEFT JOIN services s ON o.service_id = s.id WHERE 1=1";

$params = [];

if ($search) {
    $query .= " AND (o.id LIKE ? OR u.username LIKE ? OR u.first_name LIKE ?)";
    $searchTerm = "%{$search}%";
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $params[] = $searchTerm;
}

if ($status !== 'all') {
    $query .= " AND o.status = ?";
    $params[] = $status;
}

$query .= " ORDER BY o.created_at DESC LIMIT 100";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$orders = $stmt->fetchAll();
?>

<div class="page-header">
    <h1>Buyurtmalar</h1>
</div>

<div class="filters">
    <form method="GET" class="filter-form">
        <input type="hidden" name="page" value="orders">
        <select name="status" class="form-control">
            <option value="all" <?php echo $status === 'all' ? 'selected' : ''; ?>>Barchasi</option>
            <option value="pending" <?php echo $status === 'pending' ? 'selected' : ''; ?>>⏳ Kutmoqda</option>
            <option value="processing" <?php echo $status === 'processing' ? 'selected' : ''; ?>>🔄 Jarayonda</option>
            <option value="completed" <?php echo $status === 'completed' ? 'selected' : ''; ?>>✅ Bajarildi</option>
            <option value="cancelled" <?php echo $status === 'cancelled' ? 'selected' : ''; ?>>❌ Bekor qilindi</option>
        </select>
        <input type="text" name="search" placeholder="Qidiruv..." value="<?php echo htmlspecialchars($search); ?>" class="form-control">
        <button type="submit" class="btn btn-primary">Filtr</button>
    </form>
</div>

<div class="table-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Foydalanuvchi</th>
                <th>Xizmat</th>
                <th>Havola</th>
                <th>Miqdor</th>
                <th>Narx</th>
                <th>Holat</th>
                <th>Sana</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($orders as $order): 
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
                <td><a href="<?php echo htmlspecialchars($order['link']); ?>" target="_blank">Havola</a></td>
                <td><?php echo $order['quantity']; ?></td>
                <td><?php echo formatPrice($order['price']); ?></td>
                <td><span class="status-badge <?php echo $statusClass; ?>"><?php echo $statusText; ?></span></td>
                <td><?php echo date('d.m.Y H:i', strtotime($order['created_at'])); ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
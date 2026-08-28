<?php
$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $userId = $_POST['user_id'] ?? '';
    
    if ($action === 'add_balance') {
        $amount = floatval($_POST['amount']);
        $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
        $stmt->execute([$amount, $userId]);
        $success = "Balans qo'shildi!";
    } elseif ($action === 'remove_balance') {
        $amount = floatval($_POST['amount']);
        $stmt = $pdo->prepare("UPDATE users SET balance = GREATEST(0, balance - ?) WHERE id = ?");
        $stmt->execute([$amount, $userId]);
        $success = "Balans ayirildi!";
    } elseif ($action === 'ban') {
        $stmt = $pdo->prepare("UPDATE users SET is_banned = TRUE WHERE id = ?");
        $stmt->execute([$userId]);
        $success = "Foydalanuvchi ban qilindi!";
    } elseif ($action === 'unban') {
        $stmt = $pdo->prepare("UPDATE users SET is_banned = FALSE WHERE id = ?");
        $stmt->execute([$userId]);
        $success = "Foydalanuvchi bandan chiqarildi!";
    }
}

$search = $_GET['search'] ?? '';
$searchType = $_GET['type'] ?? 'id'; // id yoki username

$users = [];
if ($search) {
    if ($searchType === 'id') {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$search]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username LIKE ? OR first_name LIKE ?");
        $searchTerm = "%{$search}%";
        $stmt->execute([$searchTerm, $searchTerm]);
    }
    $users = $stmt->fetchAll();
} else {
    $stmt = $pdo->query("SELECT * FROM users ORDER BY created_at DESC LIMIT 50");
    $users = $stmt->fetchAll();
}
?>

<div class="page-header">
    <h1>Foydalanuvchilar</h1>
</div>

<?php if ($success): ?>
    <div class="alert alert-success"><?php echo $success; ?></div>
<?php endif; ?>

<div class="search-box">
    <form method="GET" class="search-form">
        <input type="hidden" name="page" value="users">
        <select name="type" class="form-control">
            <option value="id" <?php echo $searchType === 'id' ? 'selected' : ''; ?>>ID bo'yicha</option>
            <option value="username" <?php echo $searchType === 'username' ? 'selected' : ''; ?>>Ism/Username bo'yicha</option>
        </select>
        <input type="text" name="search" placeholder="Qidiruv..." value="<?php echo htmlspecialchars($search); ?>" class="form-control">
        <button type="submit" class="btn btn-primary">Qidirish</button>
        <?php if ($search): ?>
            <a href="?page=users" class="btn btn-secondary">Tozalash</a>
        <?php endif; ?>
    </form>
</div>

<div class="table-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Ism</th>
                <th>Username</th>
                <th>Balance</th>
                <th>Stars</th>
                <th>Holat</th>
                <th>Ro'yxatdan o'tgan</th>
                <th>Amallar</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($users as $user): ?>
            <tr>
                <td><code><?php echo $user['id']; ?></code></td>
                <td><?php echo htmlspecialchars($user['first_name'] . ' ' . $user['last_name']); ?></td>
                <td>@<?php echo htmlspecialchars($user['username'] ?? 'yo\'q'); ?></td>
                <td><?php echo formatPrice($user['balance']); ?></td>
                <td><?php echo $user['stars']; ?> ⭐️</td>
                <td>
                    <?php if ($user['is_banned']): ?>
                        <span class="status-badge status-cancelled">Banned</span>
                    <?php else: ?>
                        <span class="status-badge status-completed">Active</span>
                    <?php endif; ?>
                </td>
                <td><?php echo date('d.m.Y', strtotime($user['created_at'])); ?></td>
                <td class="actions">
                    <button class="btn btn-sm btn-primary" onclick="openModal('addBalance', <?php echo $user['id']; ?>)">+ Pul</button>
                    <button class="btn btn-sm btn-warning" onclick="openModal('removeBalance', <?php echo $user['id']; ?>)">- Pul</button>
                    <?php if ($user['is_banned']): ?>
                        <form method="POST" style="display:inline;">
                            <input type="hidden" name="action" value="unban">
                            <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                            <button type="submit" class="btn btn-sm btn-success">Unban</button>
                        </form>
                    <?php else: ?>
                        <form method="POST" style="display:inline;">
                            <input type="hidden" name="action" value="ban">
                            <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                            <button type="submit" class="btn btn-sm btn-danger">Ban</button>
                        </form>
                    <?php endif; ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

<!-- Modals -->
<div id="addBalanceModal" class="modal">
    <div class="modal-content">
        <h3>Balans qo'shish</h3>
        <form method="POST">
            <input type="hidden" name="action" value="add_balance">
            <input type="hidden" name="user_id" id="addBalanceUserId">
            <div class="form-group">
                <label>Miqdor (so'm)</label>
                <input type="number" name="amount" class="form-control" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('addBalance')">Bekor qilish</button>
                <button type="submit" class="btn btn-primary">Qo'shish</button>
            </div>
        </form>
    </div>
</div>

<div id="removeBalanceModal" class="modal">
    <div class="modal-content">
        <h3>Balansdan ayirish</h3>
        <form method="POST">
            <input type="hidden" name="action" value="remove_balance">
            <input type="hidden" name="user_id" id="removeBalanceUserId">
            <div class="form-group">
                <label>Miqdor (so'm)</label>
                <input type="number" name="amount" class="form-control" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('removeBalance')">Bekor qilish</button>
                <button type="submit" class="btn btn-warning">Ayirish</button>
            </div>
        </form>
    </div>
</div>
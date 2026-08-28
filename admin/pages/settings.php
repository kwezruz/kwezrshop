<?php
$success = '';
$error = '';
$settings = getSettings();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_settings') {
        $botUsername = $_POST['bot_username'] ?? '';
        $welcomeText = $_POST['welcome_text'] ?? '';
        $botStatus = $_POST['bot_status'] ?? 'on';
        $maintenanceMessage = $_POST['maintenance_message'] ?? '';
        
        $stmt = $pdo->prepare("UPDATE settings SET bot_username = ?, welcome_text = ?, bot_status = ?, maintenance_message = ?");
        $stmt->execute([$botUsername, $welcomeText, $botStatus, $maintenanceMessage]);
        $success = "Sozlamalar saqlandi!";
    }
}
?>

<div class="page-header">
    <h1>Sozlamalar</h1>
</div>

<?php if ($success): ?>
    <div class="alert alert-success"><?php echo $success; ?></div>
<?php endif; ?>

<div class="card">
    <h3>Bot Sozlamalari</h3>
    <form method="POST">
        <input type="hidden" name="action" value="update_settings">
        
        <div class="form-group">
            <label>Bot Username</label>
            <input type="text" name="bot_username" value="<?php echo htmlspecialchars($settings['bot_username']); ?>" class="form-control" placeholder="@bot_username">
        </div>
        
        <div class="form-group">
            <label>Xush kelibsiz matni</label>
            <textarea name="welcome_text" rows="4" class="form-control" placeholder="Botga start bosganda ko'rinadigan matn"><?php echo htmlspecialchars($settings['welcome_text']); ?></textarea>
        </div>
        
        <div class="form-group">
            <label>Bot holati</label>
            <select name="bot_status" class="form-control">
                <option value="on" <?php echo $settings['bot_status'] === 'on' ? 'selected' : ''; ?>>Ishlayapti (ON)</option>
                <option value="off" <?php echo $settings['bot_status'] === 'off' ? 'selected' : ''; ?>>Ta'mirlash (OFF)</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Ta'mirlash xabari</label>
            <textarea name="maintenance_message" rows="3" class="form-control" placeholder="Bot o'chiq bo'lganda ko'rinadigan xabar"><?php echo htmlspecialchars($settings['maintenance_message']); ?></textarea>
        </div>
        
        <button type="submit" class="btn btn-primary">Saqlash</button>
    </form>
</div>

<div class="card">
    <h3>Bot Haqida</h3>
    <p><strong>Bot Username:</strong> @<?php echo htmlspecialchars(BOT_USERNAME); ?></p>
    <p><strong>API URL:</strong> <?php echo API_URL; ?></p>
    <p><strong>Versiya:</strong> 1.0.0</p>
</div>
<?php
$settings = getSettings();
$success = '';
$error = '';
$apiInfo = null;
$apiServices = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'save_api_key') {
        $apiKey = $_POST['api_key'] ?? '';
        $stmt = $pdo->prepare("UPDATE settings SET api_key = ?");
        $stmt->execute([$apiKey]);
        $success = "API kalit saqlandi!";
        $settings['api_key'] = $apiKey;
    } elseif ($action === 'test_api') {
        $apiKey = $_POST['api_key'] ?? $settings['api_key'];
        
        // API test
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, API_URL . "/key");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['key' => $apiKey]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            if ($data && isset($data['account'])) {
                $apiInfo = $data['account'];
                $success = "API muvaffaqiyatli ulandi!";
            } else {
                $error = "API xatosi: Noto'g'ri javob";
            }
        } else {
            $error = "API ulanmadi. Kalitni tekshiring.";
        }
    } elseif ($action === 'import_services') {
        $apiKey = $settings['api_key'];
        
        // Kategoriyalarni olish
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, API_URL . "/categories");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['key' => $apiKey]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        
        $categories = json_decode($response, true);
        
        if ($categories) {
            foreach ($categories as $cat) {
                // Kategoriya qo'shish yoki yangilash
                $stmt = $pdo->prepare("INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?");
                $stmt->execute([$cat['category'], $cat['name'], $cat['category'], $cat['name']]);
                
                // Xizmatlarni olish
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, API_URL . "/services");
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                    'key' => $apiKey,
                    'category' => $cat['category']
                ]));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $servicesResponse = curl_exec($ch);
                curl_close($ch);
                
                $services = json_decode($servicesResponse, true);
                
                if ($services) {
                    foreach ($services as $service) {
                        // Xizmatni 200 so'm ustama bilan qo'shish
                        $newPrice = $service['rate'] + 200;
                        
                        $stmt = $pdo->prepare("INSERT INTO services (category_id, name, type, price, min_quantity, max_quantity) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, price = ?, min_quantity = ?, max_quantity = ?");
                        $stmt->execute([
                            $cat['category'],
                            $service['name'],
                            $service['type'] ?? 'default',
                            $newPrice,
                            $service['min'] ?? 1,
                            $service['max'] ?? 10000,
                            $service['name'],
                            $newPrice,
                            $service['min'] ?? 1,
                            $service['max'] ?? 10000
                        ]);
                    }
                }
            }
            
            $success = "Xizmatlar muvaffaqiyatli import qilindi!";
        } else {
            $error = "Xizmatlarni import qilishda xatolik!";
        }
    }
}

// API kalit mavjud bo'lsa ma'lumotlarni ko'rsatish
if ($settings['api_key']) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, API_URL . "/key");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['key' => $settings['api_key']]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    if ($data && isset($data['account'])) {
        $apiInfo = $data['account'];
    }
}
?>

<div class="page-header">
    <h1>API Sozlamalari</h1>
</div>

<?php if ($success): ?>
    <div class="alert alert-success"><?php echo $success; ?></div>
<?php endif; ?>

<?php if ($error): ?>
    <div class="alert alert-error"><?php echo $error; ?></div>
<?php endif; ?>

<div class="api-section">
    <div class="card">
        <h3>API Kalit</h3>
        <form method="POST" class="form-inline">
            <input type="hidden" name="action" value="save_api_key">
            <input type="password" name="api_key" value="<?php echo htmlspecialchars($settings['api_key']); ?>" class="form-control" placeholder="API kalit kiriting">
            <button type="submit" class="btn btn-primary">Saqlash</button>
            <button type="submit" name="action" value="test_api" class="btn btn-secondary">Test qilish</button>
        </form>
    </div>
    
    <?php if ($apiInfo): ?>
    <div class="card">
        <h3>API Hisob Ma'lumotlari</h3>
        <div class="api-info">
            <div class="info-row">
                <span class="label">Balance:</span>
                <span class="value"><?php echo number_format($apiInfo['balance'], 2); ?> $</span>
            </div>
            <div class="info-row">
                <span class="label">Spent:</span>
                <span class="value"><?php echo number_format($apiInfo['spent'], 2); ?> $</span>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h3>Xizmatlarni Import Qilish</h3>
        <p>API dan xizmatlarni avtomatik import qilish. Barcha xizmatlar narxiga 200 so'm ustama qo'shiladi.</p>
        <form method="POST">
            <input type="hidden" name="action" value="import_services">
            <button type="submit" class="btn btn-primary btn-large">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor"/>
                </svg>
                Xizmatlarni Import Qilish
            </button>
        </form>
    </div>
    <?php endif; ?>
</div>
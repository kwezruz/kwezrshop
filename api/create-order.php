<?php
require_once '../config.php';

header('Content-Type: application/json');

$userId = $_POST['user_id'] ?? null;
$serviceId = $_POST['service_id'] ?? null;
$link = $_POST['link'] ?? '';
$quantity = intval($_POST['quantity'] ?? 0);

if (!$userId || !$serviceId || !$link || !$quantity) {
    echo json_encode(['success' => false, 'message' => 'Barcha maydonlarni to\'ldiring']);
    exit;
}

// Get service
$stmt = $pdo->prepare("SELECT * FROM services WHERE id = ?");
$stmt->execute([$serviceId]);
$service = $stmt->fetch();

if (!$service) {
    echo json_encode(['success' => false, 'message' => 'Xizmat topilmadi']);
    exit;
}

// Check quantity
if ($quantity < $service['min_quantity'] || $quantity > $service['max_quantity']) {
    echo json_encode(['success' => false, 'message' => 'Miqdor noto\'g\'ri']);
    exit;
}

// Calculate price
$price = $service['price'] * $quantity;

// Check balance
$user = getUser($userId);
if ($user['balance'] < $price) {
    echo json_encode(['success' => false, 'message' => 'Balans yetarli emas']);
    exit;
}

// Create order
$stmt = $pdo->prepare("INSERT INTO orders (user_id, service_id, link, quantity, price) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$userId, $serviceId, $link, $quantity, $price]);

// Deduct balance
$stmt = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
$stmt->execute([$price, $userId]);

echo json_encode(['success' => true, 'message' => 'Buyurtma yaratildi']);
?>
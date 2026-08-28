<?php
require_once '../config.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['user_id'] ?? null;
$stars = intval($data['stars'] ?? 0);

if (!$userId || !$stars) {
    echo json_encode(['success' => false, 'message' => 'Noto\'g\'ri ma\'lumot']);
    exit;
}

$user = getUser($userId);

if ($user['stars'] < $stars) {
    echo json_encode(['success' => false, 'message' => 'Stars yetarli emas']);
    exit;
}

// Deduct stars
$stmt = $pdo->prepare("UPDATE users SET stars = stars - ? WHERE id = ?");
$stmt->execute([$stars, $userId]);

// Save donation
$stmt = $pdo->prepare("INSERT INTO donations (user_id, stars_amount, status) VALUES (?, ?, 'completed')");
$stmt->execute([$userId, $stars]);

echo json_encode(['success' => true, 'message' => 'Donatsiya qabul qilindi']);
?>
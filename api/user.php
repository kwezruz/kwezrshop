<?php
require_once '../config.php';

header('Content-Type: application/json');

$userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;

if (!$userId) {
    echo json_encode(['error' => 'User ID required']);
    exit;
}

$user = getUser($userId);

if (!$user) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

echo json_encode([
    'id' => $user['id'],
    'balance' => $user['balance'],
    'stars' => $user['stars']
]);
?>
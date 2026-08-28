<?php
require_once '../config.php';

header('Content-Type: application/json');

$serviceId = $_GET['id'] ?? null;

if (!$serviceId) {
    echo json_encode(['error' => 'Service ID is required']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM services WHERE id = ? AND is_active = TRUE");
$stmt->execute([$serviceId]);
$service = $stmt->fetch();

if (!$service) {
    echo json_encode(['error' => 'Service not found']);
    exit;
}

echo json_encode($service);
?>
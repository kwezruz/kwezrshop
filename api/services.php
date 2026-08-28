<?php
require_once '../config.php';

header('Content-Type: application/json');

$stmt = $pdo->query("SELECT * FROM services WHERE is_active = TRUE ORDER BY id");
$services = $stmt->fetchAll();

echo json_encode($services);
?>
<?php
$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_service') {
        $serviceId = $_POST['service_id'];
        $name = $_POST['name'];
        $price = floatval($_POST['price']);
        $minQty = intval($_POST['min_quantity']);
        $maxQty = intval($_POST['max_quantity']);
        
        $stmt = $pdo->prepare("UPDATE services SET name = ?, price = ?, min_quantity = ?, max_quantity = ? WHERE id = ?");
        $stmt->execute([$name, $price, $minQty, $maxQty, $serviceId]);
        $success = "Xizmat yangilandi!";
    }
}

$categoryId = $_GET['category'] ?? null;

// Kategoriyalar
$stmt = $pdo->query("SELECT * FROM categories ORDER BY sort_order");
$categories = $stmt->fetchAll();

// Xizmatlar
if ($categoryId) {
    $stmt = $pdo->prepare("SELECT * FROM services WHERE category_id = ? ORDER BY id");
    $stmt->execute([$categoryId]);
    $services = $stmt->fetchAll();
    
    $stmt = $pdo->prepare("SELECT name FROM categories WHERE id = ?");
    $stmt->execute([$categoryId]);
    $currentCategory = $stmt->fetch();
} else {
    $services = [];
    $currentCategory = null;
}
?>

<div class="page-header">
    <h1>Xizmatlar</h1>
</div>

<?php if ($success): ?>
    <div class="alert alert-success"><?php echo $success; ?></div>
<?php endif; ?>

<div class="categories-tabs">
    <?php foreach ($categories as $cat): ?>
        <a href="?page=services&category=<?php echo $cat['id']; ?>" class="tab <?php echo $categoryId == $cat['id'] ? 'active' : ''; ?>">
            <?php echo htmlspecialchars($cat['name']); ?>
        </a>
    <?php endforeach; ?>
</div>

<?php if ($currentCategory): ?>
    <h2><?php echo htmlspecialchars($currentCategory['name']); ?></h2>
    
    <div class="table-container">
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nomi</th>
                    <th>Turi</th>
                    <th>Narx</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Amallar</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($services as $service): ?>
                <tr>
                    <td><?php echo $service['id']; ?></td>
                    <td><?php echo htmlspecialchars($service['name']); ?></td>
                    <td><?php echo htmlspecialchars($service['type']); ?></td>
                    <td><?php echo formatPrice($service['price']); ?></td>
                    <td><?php echo $service['min_quantity']; ?></td>
                    <td><?php echo $service['max_quantity']; ?></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editService(<?php echo htmlspecialchars(json_encode($service)); ?>)">Tahrirlash</button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php elseif ($categories): ?>
    <p class="text-muted">Kategoriyani tanlang</p>
<?php else: ?>
    <p class="text-muted">Hozircha kategoriyalar yo'q. API dan import qiling.</p>
<?php endif; ?>

<!-- Edit Modal -->
<div id="editServiceModal" class="modal">
    <div class="modal-content">
        <h3>Xizmatni tahrirlash</h3>
        <form method="POST">
            <input type="hidden" name="action" value="update_service">
            <input type="hidden" name="service_id" id="editServiceId">
            
            <div class="form-group">
                <label>Nomi</label>
                <input type="text" name="name" id="editServiceName" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Narx (so'm)</label>
                <input type="number" name="price" id="editServicePrice" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Minimal miqdor</label>
                <input type="number" name="min_quantity" id="editServiceMin" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Maksimal miqdor</label>
                <input type="number" name="max_quantity" id="editServiceMax" class="form-control" required>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('editService')">Bekor qilish</button>
                <button type="submit" class="btn btn-primary">Saqlash</button>
            </div>
        </form>
    </div>
</div>
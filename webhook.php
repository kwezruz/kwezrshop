<?php
require_once 'config.php';

$update = json_decode(file_get_contents('php://input'), true);

if (!$update) {
    exit;
}

$settings = getSettings();

// Bot o'chiq bo'lsa
if ($settings['bot_status'] === 'off') {
    $message = "Bot vaqtinchalik ta'mirlanmoqda. Keyinroq qayta urinib ko'ring.";
    sendMessage($update['message']['chat']['id'], $message);
    exit;
}

if (isset($update['message'])) {
    $chatId = $update['message']['chat']['id'];
    $userId = $update['message']['from']['id'];
    $username = $update['message']['from']['username'] ?? '';
    $firstName = $update['message']['from']['first_name'] ?? '';
    $lastName = $update['message']['from']['last_name'] ?? '';
    $text = $update['message']['text'] ?? '';
    
    // Foydalanuvchini yaratish/yangilash
    createUser($userId, $username, $firstName, $lastName);
    
    // Start komandasi
    if ($text === '/start') {
        sendWelcomeMessage($chatId, $userId, $settings);
    }
    // Stars donatsiya
    elseif (preg_match('/^donate_(\d+)$/', $text, $matches)) {
        handleDonation($chatId, $userId, $matches[1]);
    }
}

// Successful Payment (Stars)
if (isset($update['successful_payment'])) {
    $userId = $update['message']['from']['id'];
    $amount = $update['successful_payment']['total_amount'] / 100; // Stars
    
    // Donatsiyani saqlash
    $stmt = $pdo->prepare("INSERT INTO donations (user_id, stars_amount, status) VALUES (?, ?, 'completed')");
    $stmt->execute([$userId, $amount]);
    
    // Foydalanuvchi balansini yangilash
    $stmt = $pdo->prepare("UPDATE users SET stars = stars + ? WHERE id = ?");
    $stmt->execute([$amount, $userId]);
    
    sendMessage($userId, "✅ Donatsiyangiz qabul qilindi!\n\nRahmat, siz {$amount} stars yubordingiz. 🌟");
}

function sendMessage($chatId, $text, $replyMarkup = null, $parseMode = 'HTML') {
    $url = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage";
    $data = [
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => $parseMode
    ];
    
    if ($replyMarkup) {
        $data['reply_markup'] = json_encode($replyMarkup);
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($result, true);
}

function sendWelcomeMessage($chatId, $userId, $settings) {
    $keyboard = [
        'inline_keyboard' => [
            [
                ['text' => ' Xizmatlar', 'callback_data' => 'services'],
                ['text' => '📊 Buyurtmalarim', 'callback_data' => 'my_orders']
            ],
            [
                ['text' => '💰 Balans', 'callback_data' => 'balance'],
                ['text' => '⭐️ Qo\'llab-quvvatlash', 'callback_data' => 'donate']
            ],
            [
                ['text' => '👤 Profil', 'callback_data' => 'profile']
            ]
        ]
    ];
    
    $text = $settings['welcome_text'] ?? "Xush kelibsiz! Bizning xizmatlardan foydalaning.";
    
    sendMessage($chatId, $text, $keyboard);
}

function handleDonation($chatId, $userId, $starsAmount) {
    global $pdo;
    
    $user = getUser($userId);
    
    if ($user['stars'] < $starsAmount) {
        sendMessage($chatId, "❌ Kechirasiz, sizda yetarli stars yo'q.\n\nSizning balansingiz: {$user['stars']} ⭐️");
        return;
    }
    
    // Stars ayirish
    $stmt = $pdo->prepare("UPDATE users SET stars = stars - ? WHERE id = ?");
    $stmt->execute([$starsAmount, $userId]);
    
    // Donatsiyani saqlash
    $stmt = $pdo->prepare("INSERT INTO donations (user_id, stars_amount, status) VALUES (?, ?, 'completed')");
    $stmt->execute([$userId, $starsAmount]);
    
    sendMessage($chatId, "✅ Donatsiyangiz qabul qilindi!\n\nRahmat, siz {$starsAmount} stars yubordingiz. 🌟");
}

// Callback query
if (isset($update['callback_query'])) {
    $chatId = $update['callback_query']['message']['chat']['id'];
    $userId = $update['callback_query']['from']['id'];
    $data = $update['callback_query']['data'];
    
    handleCallback($chatId, $userId, $data);
}

function handleCallback($chatId, $userId, $data) {
    global $pdo;
    
    switch($data) {
        case 'services':
            showCategories($chatId);
            break;
        case 'my_orders':
            showMyOrders($chatId, $userId);
            break;
        case 'balance':
            showBalance($chatId, $userId);
            break;
        case 'donate':
            showDonate($chatId, $userId);
            break;
        case 'profile':
            showProfile($chatId, $userId);
            break;
        case 'topup':
            showTopup($chatId);
            break;
    }
}

function showCategories($chatId) {
    global $pdo;
    
    $stmt = $pdo->query("SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order");
    $categories = $stmt->fetchAll();
    
    $keyboard = ['inline_keyboard' => []];
    foreach ($categories as $cat) {
        $keyboard['inline_keyboard'][] = [
            ['text' => "{$cat['icon']} {$cat['name']}", 'callback_data' => "cat_{$cat['id']}"]
        ];
    }
    $keyboard['inline_keyboard'][] = [['text' => '🔙 Orqaga', 'callback_data' => 'main']];
    
    sendMessage($chatId, "📋 Xizmatlar bo'limi", $keyboard);
}

function showBalance($chatId, $userId) {
    $user = getUser($userId);
    
    $keyboard = [
        'inline_keyboard' => [
            [['text' => '💳 Hisobni to\'ldirish', 'callback_data' => 'topup']],
            [['text' => '🔙 Orqaga', 'callback_data' => 'main']]
        ]
    ];
    
    $text = "💰 Sizning balansingiz:\n\n";
    $text .= "💵 Pul: " . formatPrice($user['balance']) . "\n";
    $text .= "⭐️ Stars: " . $user['stars'];
    
    sendMessage($chatId, $text, $keyboard);
}

function showDonate($chatId, $userId) {
    $keyboard = [
        'inline_keyboard' => [
            [
                ['text' => '10 ️', 'callback_data' => 'donate_amount_10'],
                ['text' => '50 ⭐️', 'callback_data' => 'donate_amount_50'],
                ['text' => '100 ⭐️', 'callback_data' => 'donate_amount_100']
            ],
            [
                ['text' => '500 ⭐️', 'callback_data' => 'donate_amount_500'],
                ['text' => '1000 ⭐️', 'callback_data' => 'donate_amount_1000']
            ],
            [['text' => '🔙 Orqaga', 'callback_data' => 'main']]
        ]
    ];
    
    sendMessage($chatId, "⭐️ Qancha stars donat qilmoqchisiz?", $keyboard);
}

function showProfile($chatId, $userId) {
    $user = getUser($userId);
    
    $keyboard = [
        'inline_keyboard' => [
            [['text' => '⭐️ Qo\'llab-quvvatlash', 'callback_data' => 'donate']],
            [['text' => '💳 Hisobni to\'ldirish', 'callback_data' => 'topup']],
            [['text' => '🔙 Orqaga', 'callback_data' => 'main']]
        ]
    ];
    
    $text = "👤 Profil\n\n";
    $text .= "👤 Ism: " . ($user['first_name'] ?? 'Noma\'lum') . "\n";
    $text .= " Username: @" . ($user['username'] ?? 'yo\'q') . "\n";
    $text .= " ID: <code>{$user['id']}</code>\n\n";
    $text .= "💵 Balans: " . formatPrice($user['balance']) . "\n";
    $text .= "⭐️ Stars: " . $user['stars'] . "\n\n";
    $text .= "📅 Ro'yxatdan o'tgan: " . date('d.m.Y H:i', strtotime($user['created_at']));
    
    sendMessage($chatId, $text, $keyboard, 'HTML');
}

function showTopup($chatId) {
    $keyboard = [
        'inline_keyboard' => [
            [
                ['text' => '💳 VISA', 'callback_data' => 'visa_topup'],
                ['text' => '💰 Admin orqali', 'url' => 'https://t.me/Zalsee']
            ],
            [['text' => '🔙 Orqaga', 'callback_data' => 'balance']]
        ]
    ];
    
    $text = "💳 Hisobni to'ldirish\n\n";
    $text .= "💳 VISA karta orqali to'lovni tanlang yoki admin bilan bog'laning.";
    
    sendMessage($chatId, $text, $keyboard);
}

function showMyOrders($chatId, $userId) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT o.*, s.name as service_name FROM orders o LEFT JOIN services s ON o.service_id = s.id WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 10");
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();
    
    if (empty($orders)) {
        sendMessage($chatId, "📊 Sizda hali buyurtmalar yo'q.");
        return;
    }
    
    $text = "📊 Mening buyurtmalarim:\n\n";
    foreach ($orders as $order) {
        $statusText = [
            'pending' => '⏳ Kutmoqda',
            'processing' => '🔄 Jarayonda',
            'completed' => '✅ Bajarildi',
            'cancelled' => '❌ Bekor qilindi'
        ][$order['status']];
        
        $text .= "🔹 Buyurtma #{$order['id']}\n";
        $text .= "Xizmat: {$order['service_name']}\n";
        $text .= "Miqdor: {$order['quantity']}\n";
        $text .= "Narx: " . formatPrice($order['price']) . "\n";
        $text .= "Holat: {$statusText}\n";
        $text .= "Sana: " . date('d.m.Y H:i', strtotime($order['created_at'])) . "\n\n";
    }
    
    $keyboard = ['inline_keyboard' => [['text' => '🔙 Orqaga', 'callback_data' => 'main']]];
    sendMessage($chatId, $text, $keyboard);
}
?>
<?php
$botToken = 'YOUR_BOT_TOKEN_HERE';
$webhookUrl = 'https://yourdomain.com/webhook.php';

$telegramApiUrl = "https://api.telegram.org/bot{$botToken}/setWebhook?url={$webhookUrl}";

$response = file_get_contents($telegramApiUrl);

echo $response;
?>
<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        [$key, $val] = array_map('trim', explode('=', $line, 2));
        putenv("$key=$val");
    }
}

$clientId     = getenv('NAVER_CLIENT_ID');
$clientSecret = getenv('NAVER_CLIENT_SECRET');

if (!$clientId || !$clientSecret) {
    http_response_code(500);
    echo json_encode(['error' => 'API credentials not configured']);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : 'local';

$ctx = stream_context_create(['http' => [
    'method' => 'GET',
    'header' =>
        "X-Naver-Client-Id: " . $clientId . "\r\n" .
        "X-Naver-Client-Secret: " . $clientSecret . "\r\n",
    'ignore_errors' => true,
]]);

if ($action === 'image') {
    $query = isset($_GET['query']) ? trim($_GET['query']) : '';
    if (!$query) { echo json_encode(['error' => 'query required']); exit; }

    $url = 'https://openapi.naver.com/v1/search/image.json?' . http_build_query([
        'query'   => $query,
        'display' => 1,
        'filter'  => 'large',
    ]);

    $result = @file_get_contents($url, false, $ctx);
    echo $result !== false ? $result : json_encode(['error' => 'upstream request failed']);
    exit;
}

// Default: local search
$query   = isset($_GET['query'])   ? trim($_GET['query'])   : '';
$display = isset($_GET['display']) ? intval($_GET['display']) : 5;
$start   = isset($_GET['start'])   ? intval($_GET['start'])   : 1;
$sort    = isset($_GET['sort'])    ? $_GET['sort']            : 'comment';

if (!$query) {
    echo json_encode(['error' => 'query required']);
    exit;
}

$display = max(1, min(5, $display));
$start   = max(1, min(1000, $start));
$sort    = in_array($sort, ['random', 'comment']) ? $sort : 'comment';

$url = 'https://openapi.naver.com/v1/search/local.json?' . http_build_query([
    'query'   => $query,
    'display' => $display,
    'start'   => $start,
    'sort'    => $sort,
]);

$result = @file_get_contents($url, false, $ctx);
if ($result === false) {
    echo json_encode(['error' => 'upstream request failed']);
    exit;
}

echo $result;

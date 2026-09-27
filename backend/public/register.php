<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

/** @var mysqli $db */
// database verbinding ophalen van connections.php
require_once "includes/connections.php";
// data vanuit de main.ts omzetten naar php
$data = json_decode(file_get_contents("php://input"), true);


if (!$data) {
    echo json_encode(['success' => false, 'errors' => ['general' => 'Geen data ontvangen']]);
    exit;
}
// ophalen van de waardes via nieuwe variabelen

$username = trim($data['username'] ?? '');
$age = trim($data['age'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

// errorcheck

$errors = [];

if ($username === '') {
    $errors['username'] = 'Enter your username here';
}

if ($age === '') {
    $errors['age'] = 'Enter your age here';
} else if (!is_numeric($age)) {
    $errors['age'] = 'Enter a valid age';
}

if ($email === '') {
    $errors['email'] = 'Enter your email here';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Enter a valid email address';
}

if ($password === '') {
    $errors['password'] = 'Enter your password here';
}
if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'errors' => $errors
    ]);
    exit;
}

// wachtwoord hashen
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// opgehaalde waardes m.b.v variabelen toevoegen aan database
$query = "INSERT INTO `users` (`username`, `age`, `email`, `password`)
            VALUES ('$username', '$age', '$email', '$hashedPassword')";

// controleren of de query succesvol is uitgevoerd en de response terugsturen naar de frontend
if (mysqli_query($db, $query)) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode([
        'success' => false,
        'errors' => ['general' => 'Database fout: ' . mysqli_error($db)]
    ]);
}

exit;
?>

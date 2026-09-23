<?php
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");


if ($_SESSION) {
    header('');
    exit;
}

/** @var mysqli $db */
require_once "includes/connections.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Geen data ontvangen']);
    exit;
}

$login = false;

if (isset($_POST['submit'])) {


    $email = trim($data['email']);
    $password = trim($data['password']);

    $errors = [];

    if ($email === '') {
        $errors['email'] = 'Enter you mail address here';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Enter a valid email address';
    }

    if ($password === '') {
        $errors['password'] = 'Enter your password here';
    }

    if (empty($errors)) {


        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user) {
            if (password_verify($password, $user['password'])) {

                $_SESSION['email'] = $email;
                $_SESSION['username'] = $user['username'];
                $login = true;

                header('');
                exit;

            } else {
                $errors['login'] = 'Incorrect password';
            }

        } else {
            $errors['login'] = 'User not found';
        }
    }
}
?>


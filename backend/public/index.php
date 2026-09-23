<?php

$host = "127.0.0.1";
$dbname = "catch_hub";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $username = $_POST["username"];
    $age = $_POST["age"];
    $email = $_POST["email"];
    $password = $_POST["password"];

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, age, email, password)
            VALUES (:username, :age, :email, :password)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":username" => $username,
        ":age" => $age,
        ":email" => $email,
        ":password" => $hashedPassword
    ]);

    echo "User successfully registered!";
}
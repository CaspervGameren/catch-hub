<?php

/** @var mysqli $db */
require_once "includes/connections.php";

if (isset($_POST['submit'])) {

//    $username = $_POST['username'] ?? '';
//    $age = $_POST['age'] ?? '';
//    $email = $POST['email'] ?? '';
//    $password = $_POST['password'] ?? '';
    $username = $_POST['username'];
    $age = $_POST['age'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    $errors = [];

    if ($username === '') {
        $errors['username'] = 'Vul hier je username in';
    }

    if ($age === '') {
        $errors['age'] = 'Vul hier je leeftijd in';
    } else if (!is_numeric($age)) {
        $errors['age'] = 'Leeftijd moet een getal zijn';
    }

    if ($email === '') {
        $errors['email'] = 'Vul hier je e-mailadres in';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Vul een geldig e-mailadres in';
    }

    if ($password === '') {
        $errors['password'] = 'Vul hier je wachtwoord in';
    }

    if (empty($errors)) {

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $query = "INSERT INTO `users` (`username`, `age`, `email`, `password`)
            VALUES ('$username', '$age', '$email', '$hashedPassword')";

        if (mysqli_query($db, $query)) {
            header("index.html");
            exit;
        }
    }
}

?>


<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="./css/style.css">

    <link
            href="https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,100..900;1,100..900&display=swap"
            rel="stylesheet"
    >

    <title>Catch Hub - Signup</title>
</head>

<body class="bg-[#2E2E2E]">

<div id="app"></div>

<main class="text-[#2DD6B7] min-h-screen flex justify-center">

    <section class="lg:w-[444px] lg:h-8/10 w-[300px] h-5/10 mt-44 border border-[#2DD6B7] rounded-xl px-4 pt-4 pb-4">

        <h1 class="font-[Genos] font-bold text-3xl mb-5">
            Registreer
        </h1>

        <form class="font-[Genos] text-lg" action="" method="post">
            <div class="flex gap-4 flex-row">
                <div class="relative mb-4">

                    <label for="username" class="absolute -top-2 left-3 px-1 bg-[#2E2E2E] text-xs">
                        Username:
                    </label>

                    <input class="w-[150px] lg:w-[250px] h-8 px-3 rounded-full border border-[#2DD6B7] bg-transparent outline-none"
                           id="username" type="text" maxlength="30" name="username" value="<?= $username ?? '' ?>">

                    <p class="text-red-500 text-xs mt-1">
                        <?= $errors['username'] ?? '' ?>
                    </p>

                </div>

                <div class="relative">
                    <label for="age" class="absolute -top-2 left-3 px-1 bg-[#2E2E2E] text-xs">
                        Age:
                    </label>

                    <input class="w-[95px] lg:w-[115px] h-8 px-3 rounded-full border border-[#2DD6B7] bg-transparent outline-none"
                           id="age" type="number" maxlength="2" name="age" value="<?= $age ?? '' ?>">

                    <p class="text-red-500 text-xs mt-1">
                        <?= $errors['age'] ?? '' ?>
                    </p>
                </div>
            </div>


            <div class="flex gap-6 mb-4 flex-col lg:flex-row">

                <div class="relative">
                    <label for="email" class="absolute -top-2 left-3 px-1 bg-[#2E2E2E] text-xs">
                        Email adres:
                    </label>

                    <input class="lg:w-[350px] w-[250px] h-8 px-3 rounded-full border border-[#2DD6B7] bg-transparent outline-none"
                           id="email" type="text" maxlength="33" name="email" value="<?= $email ?? '' ?>">

                    <p class="text-red-500 text-xs mt-1">
                        <?= $errors['email'] ?? '' ?>
                    </p>
                </div>

            </div>

            <div class="relative mb-4">

                <label for="password" class="absolute -top-2 left-3 px-1 bg-[#2E2E2E] text-xs">
                    Password:
                </label>

                <input class="lg:w-[350px] w-[250px] h-8 px-3 rounded-full border border-[#2DD6B7] bg-transparent outline-none"
                       id="password" type="password" maxlength="33" name="password" value="<?= $password ?? '' ?>">

                <p class="text-red-500 text-xs mt-1">
                    <?= $errors['password'] ?? '' ?>
                </p>

            </div>


            <div class="flex items-center gap-3 mt-2">

                <button class="lg:h-11 h-15 px-3 rounded-xl border border-[#2DD6B7] bg-transparent text-[#2DD6B7] font-bold hover:bg-[#2DD6B7] hover:text-[#2E2E2E] transition"
                        type="submit" name="submit">
                    Confirm Signup
                </button>


                <div class="flex flex-col items-center">

                    <span class="text-xs mb-1">
                        Already have an account?
                    </span>

                    <!--                    <a href="../index.html"-->
                    <!--                       class="h-8 w-[150px] px-8 flex items-center justify-center rounded-lg border border-[#2DD6B7] font-bold text-sm hover:bg-[#2DD6B7] hover:text-[#2E2E2E] transition">-->
                    <!--                        Go to login-->
                    <!--                    </a>-->

                </div>

            </div>

        </form>

    </section>

</main>

<script type="module" src="../src/main.ts"></script>

</body>
</html>

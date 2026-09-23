import './styles/tailwind.css'
import './styles/main.scss'
import heroImg from './assets/hero.png'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'

const registerBtn = document.getElementById("registerBtn")!;
const loginBtn = document.getElementById("loginBtn")!;

const signUpSection = document.getElementById("signUpSection")!;
const loginSection = document.getElementById("loginSection")!;

const goToLogin = document.getElementById("goToLogin")!;
const goToRegister = document.getElementById("goToRegister")!;

function showRegister() {
    signUpSection.classList.remove("hidden");
    loginSection.classList.add("hidden");

    registerBtn.classList.add("z-20");
    registerBtn.classList.remove("z-10");

    loginBtn.classList.add("z-10");
    loginBtn.classList.remove("z-20");
}

function showLogin() {
    signUpSection.classList.add("hidden");
    loginSection.classList.remove("hidden");

    loginBtn.classList.add("z-20");
    loginBtn.classList.remove("z-10");

    registerBtn.classList.add("z-10");
    registerBtn.classList.remove("z-20");
}

registerBtn.addEventListener("click", showRegister);
loginBtn.addEventListener("click", showLogin);

goToLogin.addEventListener("click", showLogin);
goToRegister.addEventListener("click", showRegister);

showRegister();
import './styles/tailwind.css'
import './styles/main.scss'

//
// const cards: CardData[] = [
//     {
//         step: "Stap 1",
//         title: "Kaart 1",
//         description: "Kaart 1 gemaakt",
//         icon: "😃",
//     },
//     {
//         step: "Stap 2",
//         title: "Kaart 2",
//         description: "Kaart 1 gemaakt",
//         icon: "🤣",
//     },
// ]
//
// type CardData = {
//     step: string,
//     title: string,
//     description: string,
//     icon: string,
// }
//
// function Card({step, title, description, icon}: CardData): HTMLElement {
//     const card = document.createElement("div");
//
//     const cardWrapper = document.createElement("div");
//
//     cardWrapper.className = "card-information"
//
//     card.append(cardWrapper);
//     card.className = 'card';
//     card.innerHTML = `
//     <p>${step}</p>
//     <h2 class="card-title">${title}</h2>
//     <p class="card-description">${description}</p>
//     <span>${icon}</span>
//     `
//
//     return card;
// }
//
// const container = document.querySelector('.cards') as HTMLElement;
//
// if (container) {
//     cards.forEach((cardData: CardData) => {
//         container.append(Card(cardData));
//     });
// }

// form ophalen

const form = document.querySelector<HTMLFormElement>('#signup-form');

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelectorAll('p[id^="error-"]')
        .forEach(p => p.textContent = '');

    const formData = new FormData(form);

    // ophalen van de waarden uit de form

    const username = formData.get('username')?.toString().trim() ?? '';
    const age = formData.get('age')?.toString().trim() ?? '';
    const email = formData.get('email')?.toString().trim() ?? '';
    const password = formData.get('password')?.toString();

    let hasErrors = false;

    // error voor username tonen bij lege string

    if (username === '') {
        const errorElement = document.querySelector('#error-username');

        if (errorElement) {
            errorElement.textContent = 'Enter your username here';
        }

        hasErrors = true;
    }

    // error voor leeftijd tonen bij lege string

    if (age === '') {
        const errorElement = document.querySelector('#error-age');

        if (errorElement) {
            errorElement.textContent = 'Enter your age here';
        }

        hasErrors = true;

        // error voor leeftijd tonen indien geen cijfer wordt gebruikt.

    } else if (!Number.isInteger(Number(age))) {
        const errorElement = document.querySelector('#error-age');

        if (errorElement) {
            errorElement.textContent = 'Enter a valid age';
        }

        hasErrors = true;

        // error voor email tonen bij lege string
    }

    if (email === '') {
        const errorElement = document.querySelector('#error-email');

        if (errorElement) {
            errorElement.textContent = 'Enter your email here';
        }

        hasErrors = true;

    } else if (!email.includes('@')) {
        const errorElement = document.querySelector('#error-email');

        if (errorElement) {
            errorElement.textContent = 'Enter a valid email address';
        }

        hasErrors = true;
    }

    if (password === '') {
        const errorElement = document.querySelector('#error-password');

        if (errorElement) {
            errorElement.textContent = 'Enter your password here';
        }

        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    const dataToSend = {
        username,
        age,
        email,
        password
    };

    try {
        const response = await fetch('/api/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        const data = await response.json();

        console.log("Antwoord van PHP:", data);

        if (data.success) {
            window.location.href = '../index.html';
            return;
        }

        if (data.errors) {
            for (const [key, value] of Object.entries(data.errors)) {

                const errorElement =
                    document.querySelector(`#error-${key}`);

                if (errorElement) {
                    errorElement.textContent = value as string;
                }
            }
        }

    } catch (error) {
        const generalError =
            document.querySelector('#error-general');

        if (generalError) {
            generalError.textContent =
                'Something went wrong. Please try again.';
        }
    }
});
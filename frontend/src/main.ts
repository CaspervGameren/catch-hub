// import './styles/tailwind.css'
// import './styles/main.scss'
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
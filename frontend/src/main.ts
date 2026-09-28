import './styles/tailwind.css'
import './styles/main.scss'
import 'iconify-icon';

const contactTrigger = document.querySelector('[data-contact-reveal]')
const contactCard = contactTrigger?.querySelector('[data-contact-card]')

if (contactTrigger && contactCard && 'IntersectionObserver' in window) {
	contactCard.classList.add('contact-reveal-pending')
	contactCard.toggleAttribute('inert', true)

	let lastScrollY = window.scrollY
	let scrollDirection: 'up' | 'down' = 'down'

	window.addEventListener('scroll', () => {
		const currentScrollY = window.scrollY
		if (currentScrollY !== lastScrollY) {
			scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up'
			lastScrollY = currentScrollY
		}
	}, { passive: true })

	const contactObserver = new IntersectionObserver(([entry]) => {
		const openFromTop = entry.isIntersecting
			? scrollDirection === 'down'
			: scrollDirection === 'up'
		contactCard.classList.toggle('contact-reveal-from-bottom', !openFromTop)
		contactCard.classList.toggle('contact-reveal-visible', entry.isIntersecting)
		contactCard.toggleAttribute('inert', !entry.isIntersecting)
	}, { threshold: 0.12 })

	contactObserver.observe(contactTrigger)
}
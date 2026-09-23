import './styles/tailwind.css'
import './styles/main.scss'

import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

const status = document.querySelector<HTMLParagraphElement>('#socket-status')

socket.on('connect', () => {
  console.log('Socket connected:', socket.id)

  if (status) {
    status.textContent = `Connected: ${socket.id}`
  }
})

socket.on('disconnect', () => {
  console.log('Socket disconnected')

  if (status) {
    status.textContent = 'Disconnected'
  }
})

const locationButton =
  document.querySelector<HTMLButtonElement>('#share-location')

const locationText =
  document.querySelector<HTMLParagraphElement>('#location')

locationButton?.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      console.log('Latitude:', latitude)
      console.log('Longitude:', longitude)

      if (locationText) {
        locationText.textContent =
          `Lat: ${latitude}, Lng: ${longitude}`
      }
    },
    (error) => {
      console.error('Could not get location:', error)
    }
  )
})
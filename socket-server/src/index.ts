import { createServer } from 'node:http'
import { Server } from 'socket.io'

const httpServer = createServer()

const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
    },
})

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id)

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id)
    })
})

httpServer.listen(3000, () => {
    console.log('Socket.IO server running on http://localhost:3000')
})
import { Server } from "socket.io";
import "dotenv/config";

const io = new Server(3000, {
    cors: {
        origin: `process.env.FRONTEND_URL`,
        methods: ["GET", "POST"]
    }
});

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);

    // User joins a room
    socket.on('room-join', (data) => {
        const { room, email } = data;
        console.log('User joined:', email, 'Room:', room);

        emailToSocketMap.set(email, socket.id);
        socketToEmailMap.set(socket.id, email);

        socket.join(room);
        io.to(room).emit("room-joined", { email, room, id: socket.id });
    });

    // Chat message handling
    socket.on("chat-message", (data) => {
        const { room, email, message, timestamp } = data;
        if (!room) {
            console.error("No room provided for chat message.");
            return;
        }
        console.log(`Chat message from ${email} in room ${room}: ${message}`);
        io.to(room).emit("chat-message", { email, message, timestamp });
    });

    // Caller initiates a call
    socket.on('call-user', ({ to, offer }) => {
        io.to(to).emit('incoming-call', { offer, from: socket.id });
    });

    // Receiver answers the call
    socket.on('answer-call', ({ to, ans }) => {
        io.to(to).emit('call-accepted', { ans, from: socket.id });
    });

    // Negotiation needed for peer connection
    socket.on('peer-nego-needed', ({ to, offer }) => {
        io.to(to).emit('peer-nego-needed', { offer, from: socket.id });
    });

    // Negotiation completed
    socket.on('peer-nego-done', ({ to, ans }) => {
        io.to(to).emit('peer-nego-final', { ans, from: socket.id });
    });

    // Handle user manually disconnecting via UI
    socket.on('disconnect-feature', () => {
        console.log(`User ${socket.id} manually disconnected`);
        handleDisconnection(socket);
    });

    // Handle automatic disconnection
    socket.on('disconnect feature', () => {
        console.log(`User ${socket.id} disconnected`);
        handleDisconnection(socket);
    });

    function handleDisconnection(socket) {
        const email = socketToEmailMap.get(socket.id);
        if (email) {
            emailToSocketMap.delete(email);
            socketToEmailMap.delete(socket.id);
            console.log(`Removed ${email} from tracking`);
        }
        io.emit('user-disconnected', { id: socket.id });
    }
});

console.log("Socket.IO server running on port 3000");

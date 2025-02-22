import { Server } from "socket.io";
import bodyParser from 'body-parser';


const io = new Server(3000, {
    cors : true,
}
);

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);

    socket.on('room-join', (data) => {
        const { room, email } = data;
        console.log('User joined server side:', email, 'Room:', room);

        emailToSocketMap.set(email, socket.id);
        socketToEmailMap.set(socket.id, email);

        io.to(room).emit("room-join", {email, id : socket.id});
        socket.join(room);
        io.to(socket.id).emit('room-join', data);
    });

    socket.on('call-user', ({to, offer}) => {
        io.to(to).emit('incoming-call', {offer, from: socket.id});
    });

    socket.on('answer-call', ({to, ans}) => {
        io.to(to).emit('call-accepted', {ans, from: socket.id});
    });

    socket.on('peer-nego-needed', ({to, offer}) => {
        io.to(to).emit('peer-nego-needed', {offer, from: socket.id});
    });

    socket.on('peer-nego-done', ({to, ans}) => {
        io.to(to).emit('peer-nego-final', {ans, from: socket.id});
    });


    
});



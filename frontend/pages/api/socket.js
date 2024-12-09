import { Server } from 'socket.io';
import clientPromise from '../../lib/mongodb'; 

let io;

export default async function handler(req, res) {
    if (!io) {
      io = new Server(res.socket.server);
      res.socket.server.io = io;
  
      io.on('connection', async (socket) => {
        console.log('New client connected');
  
        try {
          const client = await clientPromise;
          const collection = client.db('audio').collection('results');
          const pipeline = [
            { '$match': { 'operationType': 'insert' } }
          ];
  
          const changeStream = collection.watch(pipeline);
  
          changeStream.on('change', (next) => {
            socket.emit('message', next.fullDocument.results[0]);
          });
  
          socket.on('disconnect', () => {
            console.log('Client disconnected');
            changeStream.close();
          });
        } catch (error) {
          console.error('Error setting up change stream:', error);
        }
      });
    }
    res.end();
  }
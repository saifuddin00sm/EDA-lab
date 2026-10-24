import EventEmitter from "node:events"


const orderEmitter = new EventEmitter()


orderEmitter.on('order.plce', (data)=> {
    console.log('Notification sent', data)
})

orderEmitter.emit('order.placed', { orderId: 4589, total: 99.99 });
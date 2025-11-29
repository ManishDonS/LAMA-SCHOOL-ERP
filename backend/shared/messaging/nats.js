const { connect, StringCodec } = require('nats');

let natsConnection;
const sc = StringCodec();

const connectNATS = async () => {
  try {
    const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    natsConnection = await connect({ servers: natsUrl });
    console.log('✅ Connected to NATS');
    return natsConnection;
  } catch (error) {
    console.error('Failed to connect to NATS:', error);
    setTimeout(connectNATS, 5000); // Retry in 5 seconds
  }
};

const publish = async (subject, data) => {
  if (!natsConnection) {
    console.error('NATS connection not initialized');
    return;
  }
  try {
    natsConnection.publish(subject, sc.encode(JSON.stringify(data)));
    console.log(`📤 Event published: ${subject}`);
  } catch (error) {
    console.error('Error publishing event:', error);
  }
};

const subscribe = async (subject, callback) => {
  if (!natsConnection) {
    console.error('NATS connection not initialized');
    return;
  }
  try {
    const subscription = natsConnection.subscribe(subject);
    console.log(`✅ Subscribed to subject: ${subject}`);
    for await (const msg of subscription) {
      const data = JSON.parse(sc.decode(msg.data));
      callback(data);
    }
  } catch (error) {
    console.error('Error subscribing to subject:', error);
  }
};

const closeConnection = async () => {
  if (natsConnection) {
    await natsConnection.close();
    console.log('NATS connection closed');
  }
};

module.exports = {
  connectNATS,
  publish,
  subscribe,
  closeConnection,
};

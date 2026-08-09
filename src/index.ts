import dotenv from 'dotenv';

dotenv.config();

(async () => {
    await start();
})();

async function start(): Promise<void> {
    console.log('Have fun - Kristi Jorgji');
}

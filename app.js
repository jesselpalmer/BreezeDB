import BreezeDB from './src/index.js';

async function run() {
    console.log("Running BreezeDB Script with Random Values...");

    // Initialize BreezeDB with multiple physical nodes and replication factor set to 1
    const db = new BreezeDB('./database', ['node1', 'node2', 'node3'], 3, 1); // Replication factor is 1

    // Wait for the database to initialize
    try {
        await db.initializePromise;
        console.log("Database initialized");
    } catch (err) {
        console.error("Error initializing database:", err.message);
        return;
    }

    // Perform set operations
    try {
        for (let i = 1; i <= 100; i++) {
            await db.set(`key${i}`, `value${i}`);
            console.log(`Set key${i} to value${i}`);
        }

        for (let i = 1; i <= 100; i++) {
            const value = await db.get(`key${i}`);
            console.log(`Got value for key${i}: ${value}`);
        }

        const node1Data = await db.getNodeData('node1');
        const node2Data = await db.getNodeData('node2');
        const node3Data = await db.getNodeData('node3');

        console.log('Node1 Data:', node1Data);
        console.log('Node2 Data:', node2Data);
        console.log('Node3 Data:', node3Data);

        const node1Count = Object.keys(node1Data).length;
        const node2Count = Object.keys(node2Data).length;
        const node3Count = Object.keys(node3Data).length;

        console.log(`Node1 count: ${node1Count}`);
        console.log(`Node2 count: ${node2Count}`);
        console.log(`Node3 count: ${node3Count}`);
    } catch (err) {
        console.error("An error occurred during database operations:", err.message);
    }
}

run().catch(err => {
    console.error("An error occurred:", err.message);
});

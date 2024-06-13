import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import ConsistentHashRing from './consistent-hash-ring.js';

class BreezeDB {
    constructor(filePath = './mydatabase.json', nodes = ['node1'], virtualNodesCount = 3, replicationFactor = 3) {
        this.baseDir = path.resolve(filePath);
        this.nodes = nodes;
        this.replicationFactor = replicationFactor;
        this.hashRing = new ConsistentHashRing(nodes, virtualNodesCount);

        nodes.forEach(node => {
            const nodeDir = path.join(this.baseDir, node);
            if (!fs.existsSync(nodeDir)) {
                fs.mkdirSync(nodeDir, { recursive: true });
            }
        });

        this.inMemoryIndex = {};
        this.pendingWrites = [];
        this.isWriting = false;
        this.initialized = false;
        this.initializePromise = this.#initialize();

        process.on('exit', this.handleExit.bind(this));
        process.on('SIGINT', this.handleExit.bind(this));
        process.on('SIGTERM', this.handleExit.bind(this));
        process.on('uncaughtException', this.handleExit.bind(this));
    }

    async #initialize() {
        try {
            for (const node of this.nodes) {
                const nodeFilePath = path.join(this.baseDir, node, 'data.json');
                const data = await fsp.readFile(nodeFilePath, 'utf-8');
                const nodeData = JSON.parse(data);
                Object.assign(this.inMemoryIndex, nodeData);
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error('Error initializing database:', err.message);
                throw err;  // Ensure errors are propagated
            }
        } finally {
            this.initialized = true;
        }
    }

    async #waitForInitialization() {
        while (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    async set(key, value) {
        await this.#waitForInitialization();
        const preferenceList = this.hashRing.getPreferenceList(key, this.replicationFactor);
        if (!preferenceList || preferenceList.length === 0) {
            console.error(`Failed to get preference list for key: ${key}`);
            return;
        }
        console.log(`Setting key "${key}" with preference list:`, preferenceList.map(node => node.vnode));

        for (const { physicalNode, vnode } of preferenceList) {
            this.#set(key, value, physicalNode);
        }
    }

    #set(key, value, node) {
        this.inMemoryIndex[key] = value;
        this.pendingWrites.push({ key, value, node });

        if (!this.isWriting) {
            this._persistToDisk();
        }
    }

    async get(key) {
        await this.#waitForInitialization();
        const preferenceList = this.hashRing.getPreferenceList(key, this.replicationFactor);
        if (!preferenceList || preferenceList.length === 0) {
            console.error(`Failed to get preference list for key: ${key}`);
            return null;
        }
        console.log(`Getting key "${key}" with preference list:`, preferenceList.map(node => node.vnode));

        for (const { physicalNode, vnode } of preferenceList) {
            try {
                if (key in this.inMemoryIndex) {
                    return this.inMemoryIndex[key];
                }
            } catch (err) {
                console.warn(`Failed to get key "${key}" from virtual node "${vnode}" (physical node "${physicalNode}")`);
            }
        }
        throw new Error(`Key "${key}" not found in any replicas.`);
    }

    async remove(key) {
        await this.#waitForInitialization();
        const preferenceList = this.hashRing.getPreferenceList(key, this.replicationFactor);
        if (!preferenceList || preferenceList.length === 0) {
            console.error(`Failed to get preference list for key: ${key}`);
            return;
        }
        console.log(`Removing key "${key}" with preference list:`, preferenceList.map(node => node.vnode));

        for (const { physicalNode, vnode } of preferenceList) {
            this.#remove(key, physicalNode);
        }
    }

    #remove(key, node) {
        if (this.inMemoryIndex.hasOwnProperty(key)) {
            delete this.inMemoryIndex[key];
            this.pendingWrites.push({ key, value: null, node });

            if (!this.isWriting) {
                this._persistToDisk();
            }
        }
    }

    async _persistToDisk() {
        if (this.isWriting) return;
        if (this.pendingWrites.length === 0) return;

        this.isWriting = true;

        const batch = [...this.pendingWrites];
        this.pendingWrites = [];

        try {
            const nodeData = {};

            for (const { key, value, node } of batch) {
                if (!nodeData[node]) {
                    nodeData[node] = {};
                }
                if (value !== null) {
                    this.inMemoryIndex[key] = value;
                    nodeData[node][key] = value;
                } else {
                    delete this.inMemoryIndex[key];
                    nodeData[node][key] = null;
                }
            }

            for (const node of this.nodes) {
                const nodeFilePath = path.join(this.baseDir, node, 'data.json');
                const nodeContents = await fsp.readFile(nodeFilePath, 'utf-8').catch(() => '{}');
                const nodeJson = JSON.parse(nodeContents);

                Object.assign(nodeJson, nodeData[node]);

                for (const key in nodeJson) {
                    if (nodeJson[key] === null) {
                        delete nodeJson[key];
                    }
                }

                const data = JSON.stringify(nodeJson, null, 2);
                await fsp.writeFile(nodeFilePath, data, 'utf-8');
            }
        } catch (err) {
            console.error('Error writing to disk:', err.message);
            this.pendingWrites.push(...batch);  // Re-queue failed writes
        }

        this.isWriting = false;

        if (this.pendingWrites.length > 0) {
            this._persistToDisk();
        }
    }

    handleExit() {
        if (this.pendingWrites.length > 0) {
            console.log('Writing pending changes before exit...');
            this.persistToDiskSync();
        }
    }

    persistToDiskSync() {
        try {
            const nodeData = {};

            for (const { key, value, node } of this.pendingWrites) {
                if (!nodeData[node]) {
                    nodeData[node] = {};
                }
                if (value !== null) {
                    this.inMemoryIndex[key] = value;
                    nodeData[node][key] = value;
                } else {
                    delete this.inMemoryIndex[key];
                    nodeData[node][key] = null;
                }
            }

            for (const node of this.nodes) {
                const nodeFilePath = path.join(this.baseDir, node, 'data.json');
                const nodeContents = fs.readFileSync(nodeFilePath, 'utf-8');
                const nodeJson = JSON.parse(nodeContents);

                Object.assign(nodeJson, nodeData[node]);

                for (const key in nodeJson) {
                    if (nodeJson[key] === null) {
                        delete nodeJson[key];
                    }
                }

                const data = JSON.stringify(nodeJson, null, 2);
                fs.writeFileSync(nodeFilePath, data, 'utf-8');
            }
        } catch (err) {
            console.error('Error writing to disk on exit:', err.message);
        }
    }

    async getNodeData(node) {
        const nodeFilePath = path.join(this.baseDir, node, 'data.json');
        try {
            const data = await fsp.readFile(nodeFilePath, 'utf-8');
            return JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                return {}; // Return empty object if file does not exist
            } else {
                throw err;
            }
        }
    }
}

export default BreezeDB;

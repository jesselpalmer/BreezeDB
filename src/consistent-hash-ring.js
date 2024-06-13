import crypto from 'crypto';

class ConsistentHashRing {
    constructor(nodes, virtualNodesCount = 3) {
        this.virtualNodesCount = virtualNodesCount;
        this.ring = new Map();
        this.sortedKeys = [];
        this.addNodes(nodes);
    }

    addNodes(nodes) {
        nodes.forEach(node => this.addNode(node));
    }

    addNode(node) {
        for (let i = 0; i < this.virtualNodesCount; i++) {
            const vnodeKey = `${node}-vnode-${i}`;
            const hash = this.hash(vnodeKey);
            if (hash !== undefined) {
                this.ring.set(hash, { physicalNode: node, vnode: vnodeKey });
                this.sortedKeys.push(hash);
                console.log(`Adding virtual node: ${vnodeKey} with hash: ${hash}`);
            }
        }
        this.sortedKeys.sort((a, b) => a - b);
    }

    removeNode(node) {
        for (let i = 0; i < this.virtualNodesCount; i++) {
            const vnodeKey = `${node}-vnode-${i}`;
            const hash = this.hash(vnodeKey);
            if (hash !== undefined) {
                this.ring.delete(hash);
                const index = this.sortedKeys.indexOf(hash);
                if (index > -1) {
                    this.sortedKeys.splice(index, 1);
                }
            }
        }
    }

    getNode(key) {
        const hash = this.hash(key);
        if (hash === undefined) {
            console.error(`Hash for key "${key}" is undefined`);
            return null;
        }
        if (this.ring.has(hash)) {
            return this.ring.get(hash);
        }
        for (const nodeHash of this.sortedKeys) {
            if (hash <= nodeHash) {
                return this.ring.get(nodeHash);
            }
        }
        return this.ring.get(this.sortedKeys[0]);
    }

    getPreferenceList(key, n) {
        const hash = this.hash(key);
        const preferenceList = [];
        const usedPhysicalNodes = new Set();

        if (hash === undefined) {
            console.error(`Hash for key "${key}" is undefined`);
            return preferenceList;
        }

        console.log(`Hash for key "${key}": ${hash}`);
        
        let startIndex = this.sortedKeys.findIndex(k => k >= hash);
        if (startIndex === -1) startIndex = 0;  // wrap around if necessary

        for (let i = 0; i < this.sortedKeys.length && preferenceList.length < n; i++) {
            const nodeHash = this.sortedKeys[(startIndex + i) % this.sortedKeys.length];
            const nodeInfo = this.ring.get(nodeHash);
            if (!usedPhysicalNodes.has(nodeInfo.physicalNode)) {
                preferenceList.push(nodeInfo);
                usedPhysicalNodes.add(nodeInfo.physicalNode);
            }
        }
        if (preferenceList.length < n) {
            console.error(`Unable to find ${n} unique nodes for key: ${key}`);
        }

        console.log(`Preference list for key "${key}":`, preferenceList.map(node => node.vnode));
        
        return preferenceList;
    }

    hash(key) {
        if (!key) {
            console.error('Key is invalid:', key);
            return undefined;
        }
        const hash = crypto.createHash('sha256').update(key).digest('hex');
        const intHash = parseInt(hash.substring(0, 8), 16);
        if (isNaN(intHash)) {
            console.error('Hash is NaN for key:', key);
            return undefined;
        }
        return intHash;
    }
}

export default ConsistentHashRing;

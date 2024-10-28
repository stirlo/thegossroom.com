// src/workers/worker-manager.js
import workerpool from 'workerpool';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});

class WorkerManager {
    constructor(config) {
        this.config = config;
        this.pool = workerpool.pool(path.join(__dirname, 'feed-worker.js'), {
            minWorkers: 2,
            maxWorkers: 8,
            workerType: 'thread'
        });
        this.activeTasks = new Map();
    }

    async start() {
        try {
            logger.info('Starting worker manager...');
            await this.scheduleTasks();
        } catch (error) {
            logger.error('Worker manager failed to start:', error);
            throw error;
        }
    }

    async scheduleTasks() {
        const sources = this.flattenSources(this.config.sources);
        const chunks = this.chunkArray(sources, Math.ceil(sources.length / 8));

        for (const [index, chunk] of chunks.entries()) {
            const workerId = `worker-${index}`;
            this.scheduleWorker(workerId, chunk);
        }
    }

    async scheduleWorker(workerId, sources) {
        try {
            const task = this.pool.exec('processFeedChunk', [sources, this.config])
                .then(result => {
                    this.handleWorkerSuccess(workerId, result);
                    this.rescheduleWorker(workerId, sources);
                })
                .catch(error => {
                    this.handleWorkerError(workerId, error);
                    this.rescheduleWorker(workerId, sources);
                });

            this.activeTasks.set(workerId, task);
        } catch (error) {
            logger.error(`Failed to schedule worker ${workerId}:`, error);
        }
    }

    rescheduleWorker(workerId, sources) {
        const delay = this.config.defaultParams.cacheTime * 1000;
        setTimeout(() => {
            this.scheduleWorker(workerId, sources);
        }, delay);
    }

    handleWorkerSuccess(workerId, result) {
        logger.info(`Worker ${workerId} completed successfully:`, {
            processed: result.length,
            timestamp: new Date().toISOString()
        });
    }

    handleWorkerError(workerId, error) {
        logger.error(`Worker ${workerId} encountered an error:`, error);
    }

    async stop() {
        logger.info('Stopping worker manager...');
        for (const [workerId, task] of this.activeTasks.entries()) {
            try {
                await task;
                logger.info(`Worker ${workerId} completed final task`);
            } catch (error) {
                logger.error(`Worker ${workerId} failed final task:`, error);
            }
        }
        await this.pool.terminate();
        logger.info('Worker manager stopped');
    }

    flattenSources(obj, prefix = '') {
        let sources = [];
        for (const [key, value] of Object.entries(obj)) {
            if (value.primary) {
                sources = sources.concat(value.primary.map(source => ({
                    ...source,
                    category: prefix ? `${prefix}.${key}` : key
                })));
            }
            if (typeof value === 'object' && !value.primary) {
                sources = sources.concat(
                    this.flattenSources(value, prefix ? `${prefix}.${key}` : key)
                );
            }
        }
        return sources;
    }

    chunkArray(array, chunks) {
        const result = [];
        const chunkSize = Math.ceil(array.length / chunks);
        for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    }
}

export default WorkerManager;


import { EdgeDto } from "@/models/edge-dto";
import { NodeDto } from "@/models/node-dto";
import { DiContainer } from "../di-container/di-container";

export class CommandsQueue {
    private addNodeQueue: NodeDto[] = [];

    private connectNodesQueue: EdgeDto[] = [];

    constructor(
        private readonly di: DiContainer
    ) { }

    addNode(req: NodeDto): void {
        this.addNodeQueue.push(req);
    }

    connectNodes(req: EdgeDto): void {
        this.connectNodesQueue.push(req);
    }

    flush(): void {
        this.flushAddNodeQueue();
        this.flushConnectNodesQueue();
    }

    private flushAddNodeQueue(): void {
        this.addNodeQueue.forEach(req => {
            this.di.graphController.addNode(req);
        });

        this.addNodeQueue = [];
    }

    private flushConnectNodesQueue(): void {
        this.connectNodesQueue.forEach(req => {
            this.di.graphController.addEdge(req);
        });

        this.connectNodesQueue = [];
    }
}

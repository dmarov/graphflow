import { CommandsQueue } from "@/commands-queue/commands-queue";
import { EventHandler } from "@/event-handler/event-handler";
import { EventSubject } from "@/event-subject/event-subject";
import { GrabbedNodeState } from "@/grabbed-node-state/grabbed-node-state";
import { GraphStore } from "@/graph-store/graph-store";
import { HtmlView } from "@/html-view/html-view";
import { MouseState } from "@/mouse-state/mouse-state";

export class DiContainer {
    readonly graphStore: GraphStore;

    readonly eventSubject: EventSubject;

    readonly mouseState: MouseState;

    readonly grabbedNodeState: GrabbedNodeState;

    readonly htmlView: HtmlView;

    readonly commandsQueue: CommandsQueue;

    readonly eventHandler: EventHandler;

    constructor(canvasWrapper: HTMLElement) {
        this.eventSubject = new EventSubject();

        this.mouseState = new MouseState();

        this.grabbedNodeState = new GrabbedNodeState();

        this.graphStore = new GraphStore();

        this.commandsQueue = new CommandsQueue(this);

        this.eventHandler = new EventHandler(this);

        this.htmlView = new HtmlView(this, canvasWrapper);
    }
}
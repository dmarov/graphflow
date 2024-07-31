import { GraphEventType } from "./graph-event"

export interface GrabNodePayload {
    mouseX: number;
    mouseY: number;
    nodeId: string;
}

export interface GrabCanvasPayload {
    mouseX: number;
    mouseY: number;
}

export interface MoveGrabPayload {
    mouseX: number;
    mouseY: number;
}

export type GraphEvent =
    {
        type: GraphEventType.GrabNode,
        payload: GrabNodePayload,
    }
    |
    {
        type: GraphEventType.GrabCanvas,
        payload: GrabCanvasPayload,
    }
    |
    {
        type: GraphEventType.MoveGrab,
        payload: MoveGrabPayload,
    }
    |
    {
        type: GraphEventType.ReleaseGrab,
    };

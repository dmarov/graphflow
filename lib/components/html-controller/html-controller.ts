import { GraphEventType } from "../../models/events/graph-event-type";
import { LayersController } from "../../models/layers/layers-controller";
import { LayersMode } from "../../models/options/layers-mode";
import { Point } from "../../models/point/point";
import { DiContainer } from "../di-container/di-container";

export class HtmlController {
  private readonly host: HTMLElement;

  private readonly nodesContainer: HTMLElement;

  private connectionsContainer: HTMLElement;

  private readonly canvas: HTMLCanvasElement;

  private readonly canvasCtx: CanvasRenderingContext2D;

  private readonly hostResizeObserver: ResizeObserver;

  private readonly nodesResizeObserver: ResizeObserver;

  private readonly nodeElementToIdMap = new Map<HTMLElement, string>();

  private readonly nodeWrapperElementToIdMap = new Map<HTMLElement, string>();

  private readonly nodeIdToWrapperElementMap = new Map<string, HTMLElement>();

  private readonly connectionIdToElementMap = new Map<string, SVGSVGElement>();

  private grabbedNodeId: string | null = null;

  private touch1: [number, number] | null = null;

  private touch2Distance: number | null = null;

  private touch2Scale = 1;

  private currentZIndex = 0;

  private readonly onPointerDown = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    if (this.di.options.shift.enabled === false) {
      return;
    }

    this.di.eventSubject.dispatch(GraphEventType.GrabViewport);
  };

  private readonly onTouchStart = (event: TouchEvent) => {
    if (this.di.options.shift.enabled === false) {
      return;
    }

    this.touch1 = [event.touches[0].clientX, event.touches[0].clientY];

    if (event.touches.length > 1) {
      const dx = event.touches[1].clientX - event.touches[0].clientX;
      const dy = event.touches[1].clientY - event.touches[0].clientY;
      this.touch2Distance = Math.sqrt(dx * dx + dy * dy);
      this.touch2Scale = this.di.viewportTransformer.getAbsoluteScale();
    }
  };

  private readonly onTouchMove = (event: TouchEvent) => {
    if (this.grabbedNodeId !== null) {
      if (this.di.options.nodes.draggable === false) {
        return;
      }

      if (this.touch1 !== null) {
        this.di.eventSubject.dispatch(GraphEventType.DragNode, {
          nodeId: this.grabbedNodeId,
          dx: event.touches[0].clientX - this.touch1[0],
          dy: event.touches[0].clientY - this.touch1[1],
        });
      }
    } else {
      if (this.di.options.shift.enabled === false) {
        return;
      }

      if (this.touch1 !== null) {
        this.di.eventSubject.dispatch(GraphEventType.DragViewport, {
          dx: event.touches[0].clientX - this.touch1[0],
          dy: event.touches[0].clientY - this.touch1[1],
        });
      }

      if (this.touch1 !== null && this.touch2Distance !== null) {
        const dxn = event.touches[1].clientX - this.touch1[0];
        const dyn = event.touches[1].clientY - this.touch1[1];
        const nextScale = Math.sqrt(dxn * dxn + dyn * dyn);
        const { left, top } = this.host.getBoundingClientRect();
        this.di.eventSubject.dispatch(GraphEventType.SetViewportScale, {
          scale:
            ((nextScale / this.touch2Distance) *
              this.di.viewportTransformer.getAbsoluteScale()) /
            this.touch2Scale,
          centerX:
            (event.touches[1].clientX + event.touches[0].clientX) / 2 - left,
          centerY:
            (event.touches[1].clientY + event.touches[0].clientY) / 2 - top,
        });
      }
    }

    event.preventDefault();

    this.touch1 = [event.touches[0].clientX, event.touches[0].clientY];
  };

  private readonly onTouchEnd = (event: TouchEvent) => {
    if (this.di.options.shift.enabled === false) {
      return;
    }

    if (event.touches.length < 2) {
      this.touch2Distance = null;
      this.touch2Scale = 1;
    }

    if (event.touches.length < 1) {
      this.touch1 = null;
    }
  };

  private readonly onPointerMove = (event: MouseEvent) => {
    if (event.buttons !== 1) {
      return;
    }

    if (this.grabbedNodeId !== null) {
      if (this.di.options.nodes.draggable === false) {
        return;
      }

      this.di.eventSubject.dispatch(GraphEventType.DragNode, {
        nodeId: this.grabbedNodeId,
        dx: event.movementX,
        dy: event.movementY,
      });
    } else {
      if (this.di.options.shift.enabled === false) {
        return;
      }

      this.di.eventSubject.dispatch(GraphEventType.DragViewport, {
        dx: event.movementX,
        dy: event.movementY,
      });
    }
  };

  private readonly onPointerUp = (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    if (this.di.options.shift.enabled === false) {
      return;
    }

    this.grabbedNodeId = null;
    this.di.eventSubject.dispatch(GraphEventType.Release);
  };

  private readonly onWheelScroll = (event: WheelEvent) => {
    if (this.di.options.scale.enabled === false) {
      return;
    }

    const trigger = this.di.options.scale.trigger;

    if (
      (trigger === "ctrl+wheel" || trigger === "ctrl+shift+wheel") &&
      !event.ctrlKey
    ) {
      return;
    }

    if (
      (trigger === "shift+wheel" || trigger === "ctrl+shift+wheel") &&
      !event.shiftKey
    ) {
      return;
    }

    const { left, top } = this.host.getBoundingClientRect();
    const centerX = event.clientX - left;
    const centerY = event.clientY - top;

    this.di.eventSubject.dispatch(GraphEventType.ScaleViewport, {
      deltaY: event.deltaY,
      centerX,
      centerY,
    });

    event.preventDefault();
  };

  private readonly onNodePointerDown = (event: MouseEvent) => {
    if (event.button !== 0 || this.di.options.nodes.draggable == false) {
      return;
    }

    event.stopPropagation();

    const nodeId = this.nodeElementToIdMap.get(
      event.currentTarget as HTMLElement,
    )!;

    this.grabbedNodeId = nodeId;
    this.di.eventSubject.dispatch(GraphEventType.GrabNode, {
      nodeId,
    });
  };

  private readonly onNodeTouchStart = (event: TouchEvent) => {
    if (this.di.options.nodes.draggable == false) {
      return;
    }

    event.stopPropagation();

    const nodeId = this.nodeElementToIdMap.get(
      event.currentTarget as HTMLElement,
    )!;

    this.grabbedNodeId = nodeId;
    this.di.eventSubject.dispatch(GraphEventType.GrabNode, {
      nodeId,
    });

    this.touch1 = [event.touches[0].clientX, event.touches[0].clientY];
  };

  private readonly onNodeTouchEnd = (event: TouchEvent) => {
    if (this.di.options.nodes.draggable == false) {
      return;
    }

    event.stopPropagation();

    this.grabbedNodeId = null;
    this.di.eventSubject.dispatch(GraphEventType.Release);
  };

  private readonly onNodePointerUp = (event: MouseEvent) => {
    if (event.button !== 0 || this.di.options.nodes.draggable == false) {
      return;
    }

    event.stopPropagation();

    this.grabbedNodeId = null;
    this.di.eventSubject.dispatch(GraphEventType.Release);
  };

  private readonly layers: { [key in LayersMode]: LayersController } = {
    "connections-on-top": {
      create: () => {
        this.host.appendChild(this.nodesContainer);
        this.host.appendChild(this.connectionsContainer);
      },
      update: (sv: number, xv: number, yv: number) => {
        this.nodesContainer.style.transform = `matrix(${sv}, 0, 0, ${sv}, ${xv}, ${yv})`;
        this.connectionsContainer.style.transform = `matrix(${sv}, 0, 0, ${sv}, ${xv}, ${yv})`;
      },
      moveOnTop: (nodeId: string) => {
        this.currentZIndex += 1;
        const wrapper = this.nodeIdToWrapperElementMap.get(nodeId)!;
        wrapper.style.zIndex = `${this.currentZIndex}`;
      },
    },
    "connections-follow-node": {
      create: () => {
        this.host.appendChild(this.nodesContainer);
        this.connectionsContainer = this.nodesContainer;
      },
      update: (sv: number, xv: number, yv: number) => {
        this.nodesContainer.style.transform = `matrix(${sv}, 0, 0, ${sv}, ${xv}, ${yv})`;
      },
      moveOnTop: (nodeId: string) => {
        const wrapper = this.nodeIdToWrapperElementMap.get(nodeId)!;
        this.currentZIndex += 2;
        wrapper.style.zIndex = `${this.currentZIndex}`;
        const connections =
          this.di.graphStore.getAllAdjacentToNodeConnections(nodeId);
        connections.forEach((connection) => {
          this.connectionIdToElementMap.get(connection)!.style.zIndex =
            `${this.currentZIndex - 1}`;
        });
      },
    },
    "nodes-on-top": {
      create: () => {
        this.host.appendChild(this.connectionsContainer);
        this.host.appendChild(this.nodesContainer);
      },
      update: (sv: number, xv: number, yv: number) => {
        this.nodesContainer.style.transform = `matrix(${sv}, 0, 0, ${sv}, ${xv}, ${yv})`;
        this.connectionsContainer.style.transform = `matrix(${sv}, 0, 0, ${sv}, ${xv}, ${yv})`;
      },
      moveOnTop: (nodeId: string) => {
        this.currentZIndex += 1;
        const wrapper = this.nodeIdToWrapperElementMap.get(nodeId)!;
        wrapper.style.zIndex = `${this.currentZIndex}`;
      },
    },
  };

  constructor(
    private readonly canvasWrapper: HTMLElement,
    private readonly di: DiContainer,
  ) {
    this.host = this.createHost();
    this.host.addEventListener("mousedown", this.onPointerDown);
    this.host.addEventListener("mouseup", this.onPointerUp);
    this.host.addEventListener("mousemove", this.onPointerMove);
    this.host.addEventListener("wheel", this.onWheelScroll);
    this.host.addEventListener("touchstart", this.onTouchStart);
    this.host.addEventListener("touchmove", this.onTouchMove);
    this.host.addEventListener("touchend", this.onTouchEnd);
    this.host.addEventListener("touchcancel", this.onTouchEnd);

    this.canvas = this.createCanvas();
    this.nodesContainer = this.createNodesContainer();
    this.connectionsContainer = this.createConnectionsContainer();

    const context = this.canvas.getContext("2d");

    if (context === null) {
      throw new Error("unable to get canvas context");
    }

    this.canvasCtx = context;

    this.host.appendChild(this.canvas);

    const mode = this.di.options.layers.mode;

    this.layers[mode].create();

    this.canvasWrapper.appendChild(this.host);

    this.hostResizeObserver = this.createHostResizeObserver();
    this.hostResizeObserver.observe(this.host);

    this.nodesResizeObserver = this.createNodesResizeObserver();
  }

  clear(): void {
    Array.from(this.connectionIdToElementMap.keys()).forEach((connectionId) => {
      this.detachConnection(connectionId);
    });

    Array.from(this.nodeElementToIdMap.values()).forEach((nodeId) => {
      this.detachNode(nodeId);
    });
  }

  destroy(): void {
    this.host.removeEventListener("mousedown", this.onPointerDown);
    this.host.removeEventListener("mouseup", this.onPointerUp);
    this.host.removeEventListener("mousemove", this.onPointerMove);
    this.host.removeEventListener("wheel", this.onWheelScroll);
    this.host.removeEventListener("touchstart", this.onTouchStart);
    this.host.removeEventListener("touchmove", this.onTouchMove);
    this.host.removeEventListener("touchend", this.onTouchEnd);
    this.host.removeEventListener("touchcancel", this.onTouchEnd);
    this.hostResizeObserver.disconnect();
    this.nodesResizeObserver.disconnect();
    this.host.removeChild(this.canvas);
    this.host.removeChild(this.connectionsContainer);
    this.host.removeChild(this.nodesContainer);
    this.canvasWrapper.removeChild(this.host);
  }

  setCursor(type: "grab" | "default"): void {
    if (type === "grab") {
      this.host.style.cursor = "grab";
    } else {
      this.host.style.removeProperty("cursor");
    }
  }

  applyTransform(): void {
    this.canvasCtx.clearRect(
      0,
      0,
      this.canvasCtx.canvas.width,
      this.canvasCtx.canvas.height,
    );

    this.canvasCtx.save();

    this.di.options.background.drawingFn(
      this.canvasCtx,
      this.di.publicViewportTransformer,
    );

    this.canvasCtx.restore();

    const [xv, yv] = this.di.viewportTransformer.getViewportCoords(0, 0);
    const sv = this.di.viewportTransformer.getViewportScale();

    this.layers[this.di.options.layers.mode].update(sv, xv, yv);
  }

  attachNode(nodeId: string): void {
    const node = this.di.graphStore.getNode(nodeId);

    const wrapper = document.createElement("div");
    wrapper.appendChild(node.element);

    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.zIndex = `${this.currentZIndex}`;
    this.currentZIndex += 1;
    wrapper.style.visibility = "hidden";

    this.nodesContainer.appendChild(wrapper);

    this.nodeElementToIdMap.set(node.element, nodeId);
    this.nodeWrapperElementToIdMap.set(wrapper, nodeId);
    this.nodeIdToWrapperElementMap.set(nodeId, wrapper);

    this.updateNodeCoords(nodeId, node.x, node.y);
    this.nodesResizeObserver.observe(wrapper);

    wrapper.style.visibility = "visible";
    node.element.addEventListener("mousedown", this.onNodePointerDown);
    node.element.addEventListener("mouseup", this.onNodePointerUp);
    node.element.addEventListener("touchstart", this.onNodeTouchStart);
    node.element.addEventListener("touchend", this.onNodeTouchEnd);
  }

  detachNode(nodeId: string): void {
    const node = this.di.graphStore.getNode(nodeId);

    this.nodesResizeObserver.unobserve(node.element);
    this.nodesContainer.removeChild(node.element);

    node.element.removeEventListener("mousedown", this.onNodePointerDown);
    node.element.removeEventListener("mouseup", this.onNodePointerUp);
    node.element.removeEventListener("touchstart", this.onNodeTouchStart);
    node.element.removeEventListener("touchend", this.onNodeTouchEnd);

    const wrapper = this.nodeIdToWrapperElementMap.get(nodeId)!;
    wrapper.removeChild(node.element);

    this.nodeElementToIdMap.delete(node.element);
    this.nodeWrapperElementToIdMap.delete(wrapper);
    this.nodeIdToWrapperElementMap.delete(nodeId);
  }

  attachConnection(connectionId: string): void {
    const connection = this.di.graphStore.getConnection(connectionId);
    const element = connection.controller.svg;

    element.style.transformOrigin = "50% 50%";
    element.style.position = "absolute";
    element.style.top = "0";
    element.style.left = "0";
    element.style.zIndex = `${this.currentZIndex}`;
    this.currentZIndex += 1;

    this.connectionIdToElementMap.set(connectionId, element);

    this.updateConnectionCoords(connectionId);

    this.connectionsContainer.appendChild(element);
  }

  detachConnection(connectionId: string): void {
    const element = this.connectionIdToElementMap.get(connectionId);
    this.connectionIdToElementMap.delete(connectionId);
    this.connectionsContainer.removeChild(element!);
  }

  moveNodeOnTop(nodeId: string): void {
    this.layers[this.di.options.layers.mode].moveOnTop(nodeId);
  }

  updateNodePosition(nodeId: string): void {
    const node = this.di.graphStore.getNode(nodeId);
    const connections =
      this.di.graphStore.getAllAdjacentToNodeConnections(nodeId);

    this.updateNodeCoords(nodeId, node.x, node.y);

    connections.forEach((connection) => {
      this.updateConnectionCoords(connection);
    });
  }

  updatePortConnections(portId: string): void {
    const connections =
      this.di.graphStore.getAllAdjacentToPortConnections(portId);

    connections.forEach((connection) => {
      this.updateConnectionCoords(connection);
    });
  }

  getViewportDimensions(): Point {
    const rect = this.host.getBoundingClientRect();

    return [rect.width, rect.height];
  }

  private createHost(): HTMLDivElement {
    const host = document.createElement("div");

    host.style.width = "100%";
    host.style.height = "100%";
    host.style.position = "relative";
    host.style.overflow = "hidden";

    return host;
  }

  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");

    canvas.style.position = "absolute";
    canvas.style.inset = "0";

    return canvas;
  }

  private createNodesContainer(): HTMLDivElement {
    const nodesContainer = document.createElement("div");

    nodesContainer.style.position = "absolute";
    nodesContainer.style.top = "0";
    nodesContainer.style.left = "0";
    nodesContainer.style.width = "0";
    nodesContainer.style.height = "0";

    return nodesContainer;
  }

  private createConnectionsContainer(): HTMLDivElement {
    const edgesContainer = document.createElement("div");

    edgesContainer.style.position = "absolute";
    edgesContainer.style.pointerEvents = "none";
    edgesContainer.style.top = "0";
    edgesContainer.style.left = "0";
    edgesContainer.style.width = "0";
    edgesContainer.style.height = "0";

    return edgesContainer;
  }

  private createHostResizeObserver(): ResizeObserver {
    return new ResizeObserver(() => {
      this.updateCanvasDimensions();
      this.applyTransform();
    });
  }

  private createNodesResizeObserver(): ResizeObserver {
    return new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const wrapper = entry.target as HTMLElement;
        const nodeId = this.nodeWrapperElementToIdMap.get(wrapper)!;
        const node = this.di.graphStore.getNode(nodeId!);

        this.updateNodeCoords(nodeId, node.x, node.y);

        const connections =
          this.di.graphStore.getAllAdjacentToNodeConnections(nodeId);

        connections.forEach((connection) => {
          this.updateConnectionCoords(connection);
        });
      });
    });
  }

  private updateCanvasDimensions(): void {
    const { width, height } = this.host.getBoundingClientRect();

    this.canvas.width = width;
    this.canvas.height = height;
  }

  private updateNodeCoords(nodeId: string, x: number, y: number): void {
    const wrapper = this.nodeIdToWrapperElementMap.get(nodeId)!;
    const { width, height } = wrapper.getBoundingClientRect();
    const sa = this.di.viewportTransformer.getAbsoluteScale();
    const node = this.di.graphStore.getNode(nodeId)!;
    const [centerX, centerY] = node.centerFn(width, height);

    wrapper.style.transform = `matrix(1, 0, 0, 1, ${x - sa * centerX}, ${y - sa * centerY})`;
  }

  private updateConnectionCoords(connectionId: string): void {
    const connection = this.di.graphStore.getConnection(connectionId);
    const portFrom = this.di.graphStore.getPort(connection.from);
    const portTo = this.di.graphStore.getPort(connection.to);

    const rectFrom = portFrom.element.getBoundingClientRect();
    const rectTo = portTo.element.getBoundingClientRect();
    const rect = this.host.getBoundingClientRect();

    const [xAbsFrom, yAbsFrom] = this.di.viewportTransformer.getAbsoluteCoords(
      rectFrom.left - rect.left,
      rectFrom.top - rect.top,
    );

    const [xAbsTo, yAbsTo] = this.di.viewportTransformer.getAbsoluteCoords(
      rectTo.left - rect.left,
      rectTo.top - rect.top,
    );

    const sa = this.di.viewportTransformer.getAbsoluteScale();

    const [xCenterFrom, yCenterFrom] = portFrom.centerFn(
      rectFrom.width * sa,
      rectFrom.height * sa,
    );

    const [xCenterTo, yCenterTo] = portTo.centerFn(
      rectTo.width * sa,
      rectTo.height * sa,
    );

    const xAbsCenterFrom = xCenterFrom + xAbsFrom;
    const yAbsCenterFrom = yCenterFrom + yAbsFrom;
    const xAbsCenterTo = xCenterTo + xAbsTo;
    const yAbsCenterTo = yCenterTo + yAbsTo;

    const x = Math.min(xAbsCenterFrom, xAbsCenterTo);
    const y = Math.min(yAbsCenterFrom, yAbsCenterTo);
    const width = Math.abs(xAbsCenterTo - xAbsCenterFrom);
    const height = Math.abs(yAbsCenterTo - yAbsCenterFrom);

    const element = this.connectionIdToElementMap.get(connectionId)!;

    const flipHor = xAbsCenterFrom <= xAbsCenterTo;
    const flipVert = yAbsCenterFrom <= yAbsCenterTo;

    element.style.transform = `matrix(${flipHor ? 1 : -1}, 0, 0, ${flipVert ? 1 : -1}, ${x}, ${y})`;

    connection.controller.update(x, y, width, height, portFrom, portTo);
  }
}

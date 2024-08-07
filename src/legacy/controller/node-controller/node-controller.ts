import { DiContainer } from "../di-container/di-container";

export class NodeController {
    constructor(
        private readonly di: DiContainer,
        private readonly id: string,
        private readonly el: HTMLElement,
        private x: number,
        private y: number,
    ) {
        this.di.htmlView.appendNode(this.id, this.el, this.x, this.y);
    }

    get centerX(): number {
        return this.x;
    }

    get centerY(): number {
        return this.y;
    }

    moveOnTop(): void {
        this.di.htmlView.moveNodeOnTop(this.el);
    }

    moveTo(x: number, y: number): void {
        this.di.htmlView.moveNodeTo(this.el, x, y);

        this.x = x;
        this.y = y;

        this.di.graphController.getAdjacentEdges(this.id).forEach(edge => {
            edge.updatePosition();
        });
    }

    updateTransform(dx: number, dy: number, scale: number): void {
        this.di.htmlView.updateNodeTransform(this.el, this.x, this.y, dx, dy, scale);
    }
}

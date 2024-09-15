import { ConnectionController } from "../../models/connection/connection-controller";
import { PortPayload } from "../../models/store/port-payload";
import { ConnectionUtils } from "../../utils/connection-utils/connection-utils";

export class BezierConnectionController implements ConnectionController {
  constructor(
    private readonly color: string,
    private readonly width: number,
    private readonly curvature: number,
    private readonly arrowLength: number,
    private readonly arrowWidth: number,
    private readonly hasSourceArrow: boolean,
    private readonly hasTargetArrow: boolean,
  ) {}

  createSvg(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("stroke", this.color);
    line.setAttribute("stroke-width", `${this.width}`);
    line.setAttribute("fill", "none");
    svg.appendChild(line);

    if (this.hasSourceArrow) {
      const arrow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );

      arrow.setAttribute("fill", this.color);
      svg.appendChild(arrow);
    }

    if (this.hasTargetArrow) {
      const arrow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );

      arrow.setAttribute("fill", this.color);
      svg.appendChild(arrow);
    }

    svg.style.overflow = "visible";

    return svg;
  }

  updateSvg(
    svg: SVGSVGElement,
    width: number,
    height: number,
    from: PortPayload,
    to: PortPayload,
  ): void {
    const fromCenter = ConnectionUtils.getPortCenter(from);
    const toCenter = ConnectionUtils.getPortCenter(to);
    const multX = fromCenter[0] <= toCenter[0] ? 1 : -1;
    const multY = fromCenter[1] <= toCenter[1] ? 1 : -1;
    const fromVect = ConnectionUtils.getDirectionVector(
      from.direction,
      multX,
      multY,
    );
    const toVect = ConnectionUtils.getDirectionVector(
      to.direction,
      multX,
      multY,
    );

    const pointBegin = ConnectionUtils.rotate(
      [this.arrowLength, 0],
      fromVect,
      [0, 0],
    );

    const pointEnd = ConnectionUtils.rotate(
      [width - this.arrowLength, height],
      toVect,
      [width, height],
    );

    const bpb = [
      pointBegin[0] + fromVect[0] * this.curvature,
      pointBegin[1] + fromVect[1] * this.curvature,
    ];

    const bpe = [
      pointEnd[0] - toVect[0] * this.curvature,
      pointEnd[1] - toVect[1] * this.curvature,
    ];

    const lmove = `M ${pointBegin[0]} ${pointBegin[1]}`;
    const lcurve = `C ${bpb[0]} ${bpb[1]}, ${bpe[0]} ${bpe[1]}, ${pointEnd[0]} ${pointEnd[1]}`;
    const linePath = `${lmove} ${lcurve}`;

    const line = svg.children[0]!;
    line.setAttribute("d", linePath);

    if (this.hasSourceArrow) {
      const arrowPath = ConnectionUtils.getArrowPath(
        fromVect,
        0,
        0,
        this.arrowLength,
        this.arrowWidth,
      );

      const arrow = svg.children[1]!;
      arrow.setAttribute("d", arrowPath);
    }

    if (this.hasTargetArrow) {
      const arrowPath = ConnectionUtils.getArrowPath(
        toVect,
        width,
        height,
        -this.arrowLength,
        this.arrowWidth,
      );

      const arrow = svg.children[this.hasSourceArrow ? 2 : 1]!;
      arrow.setAttribute("d", arrowPath);
    }
  }
}

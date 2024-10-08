import { PublicViewportTransformer } from "../../components/public-viewport-transformer/public-viewport-transformer";
import { CenterFn } from "../center/center-fn";
import { ScaleTrigger } from "../scale/scale-trigger.type";
import { ConnectionControllerFactory } from "./connection-controller-factory";
import { LayersMode } from "./layers-mode";

export interface Options {
  readonly scale: {
    readonly enabled: boolean;
    readonly velocity: number;
    readonly min: number | null;
    readonly max: number | null;
    readonly trigger: ScaleTrigger;
  };
  readonly background: {
    readonly drawingFn: (
      ctx: CanvasRenderingContext2D,
      transformer: PublicViewportTransformer,
    ) => void;
  };
  readonly shift: {
    readonly enabled: boolean;
  };
  readonly nodes: {
    readonly draggable: boolean;
    readonly centerFn: CenterFn;
  };
  readonly ports: {
    readonly centerFn: CenterFn;
  };
  readonly connections: {
    readonly controllerFactory: ConnectionControllerFactory;
  };
  readonly layers: {
    readonly mode: LayersMode;
  };
}

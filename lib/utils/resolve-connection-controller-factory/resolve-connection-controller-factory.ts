import { BezierConnectionController } from "../../const/bezier-connection-controller/bezier-connection-controller";
import { LineConnectionController } from "../../const/line-connection-controller/line-connection-controller";
import { ConnectionOptions } from "../../models/options/connection-options";

export const resolveConnectionControllerFactory = (
  options: ConnectionOptions,
) => {
  switch (options?.type) {
    case "custom":
      return options.controllerFactory;
    case "line":
      return () =>
        new LineConnectionController(
          options.color ?? "#5c5c5c",
          options.width ?? 1,
          options.arowLength ?? 15,
          options.arowWidth ?? 4,
          options.hasSourceArrow ?? false,
          options.hasTargetArrow ?? true,
        );
    default:
      return () =>
        new BezierConnectionController(
          options.color ?? "#5c5c5c",
          options.width ?? 1,
          options.curvature ?? 90,
          options.arowLength ?? 15,
          options.arowWidth ?? 4,
          options.hasSourceArrow ?? false,
          options.hasTargetArrow ?? true,
        );
  }
};

declare module "react-plotly.js" {
  import type { ComponentType } from "react";

  const Plot: ComponentType<{
    data: unknown[];
    layout?: Record<string, unknown>;
    config?: Record<string, unknown>;
    useResizeHandler?: boolean;
    style?: Record<string, string | number>;
  }>;

  export default Plot;
}

import { useId, type SVGProps } from "react";

/**
 * Didit brand mark: the outline path is copied unchanged from didit.me/logos/switch/didit.svg
 * (the mark's clip path). Didit fills it with a raster gradient; here the same colours are drawn
 * as vector gradients sampled from Didit's own app icon, so nothing is loaded from didit.me.
 */
export function DiditLogo({ title = "Didit", ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0.52 0.98 264.4 264.4" role="img" aria-label={title} {...props}>
      <defs>
        <linearGradient id={`${id}x`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a8f0ff" />
          <stop offset="0.4" stopColor="#6cc2fb" />
          <stop offset="0.65" stopColor="#5f79de" />
          <stop offset="1" stopColor="#5049cc" />
        </linearGradient>
        <linearGradient id={`${id}y`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0073e4" />
          <stop offset="0.2" stopColor="#1664dd" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#2858d7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        fill={`url(#${id}x)`}
        d="M132.72,264.47c-55.31,0-100.31-45-100.31-100.31v-62.87C32.41,45.98,77.41.98,132.72.98s100.31,45,100.31,100.31v62.87c.24,26.420-10,51.490-28.84,70.500-19.05,19.220-44.43,29.810-71.47,29.810ZM132.72,24.71c-42.23,0-76.58,34.350-76.58,76.580v62.870c0,42.230,34.350,76.580,76.580,76.580,20.660,0,40.050-8.090,54.610-22.780,14.350-14.480,22.150-33.540,21.970-53.690v-62.970c0-42.230-34.350-76.580-76.580-76.580Z"
      />
      <path
        fillRule="evenodd"
        fill={`url(#${id}y)`}
        d="M132.72,264.47c-55.31,0-100.31-45-100.31-100.31v-62.87C32.41,45.98,77.41.98,132.72.98s100.31,45,100.31,100.31v62.87c.24,26.420-10,51.490-28.84,70.500-19.05,19.220-44.43,29.810-71.47,29.810ZM132.72,24.71c-42.23,0-76.58,34.350-76.58,76.580v62.870c0,42.230,34.350,76.580,76.580,76.580,20.660,0,40.050-8.090,54.610-22.780,14.350-14.480,22.150-33.540,21.970-53.690v-62.970c0-42.230-34.350-76.580-76.580-76.580Z"
      />
    </svg>
  );
}

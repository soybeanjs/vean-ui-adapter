import { colord } from '@soybeanjs/colord';
import type { Colord, RgbColor } from '@soybeanjs/colord';

function parseColor(color: string): Colord {
  // colord's CSS4 parser does not accept legacy rgba(), while Naive requires it.
  return colord(color.replace(/^rgba\(([^,]+),([^,]+),([^,]+),([^,]+)\)$/i, 'rgb($1 $2 $3 / $4)'));
}

function serializeColor({ r, g, b, alpha }: RgbColor): string {
  const channels = [r, g, b].map(Math.round).join(', ');
  return alpha < 1 ? `rgba(${channels}, ${alpha})` : `rgb(${channels})`;
}

/** Normalize modern CSS colors for target libraries' legacy color parsers. */
export function toColor(color: string): string {
  return serializeColor(parseColor(color).toRgb());
}

export function toRgbTriplet(color: string): string {
  const { r, g, b } = parseColor(color).toRgb();
  return [r, g, b].map(Math.round).join(', ');
}

/** Multiply, rather than replace, the alpha already resolved by the theme engine. */
export function opacity(color: string, amount: number): string {
  const parsed = parseColor(color);
  return serializeColor(parsed.alpha(parsed.alpha() * amount).toRgb());
}

/** Linear RGB mixing matches the CSS libraries' light/dark tint conventions. */
export function mix(color: string, target: string, amount: number): string {
  const source = parseColor(color).toRgb();
  const destination = parseColor(target).toRgb();
  const blend = (start: number, end: number): number => start + (end - start) * amount;

  return serializeColor(
    colord({
      r: blend(source.r, destination.r),
      g: blend(source.g, destination.g),
      b: blend(source.b, destination.b),
      alpha: blend(source.alpha, destination.alpha)
    }).toRgb()
  );
}

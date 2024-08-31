export interface ApiNode {
  id?: string;
  element: HTMLElement;
  x: number;
  y: number;
  ports?: Record<string, HTMLElement>;
}

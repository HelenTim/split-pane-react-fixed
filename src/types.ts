import React from "react";

export interface HTMLElementProps {
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  role?: string;
}

export interface IAxis {
  x: number;
  y: number;
}

export interface ICacheSizes {
  sizes: (string | number)[];
  sashPosSizes: (string | number)[];
}

export interface ISplitProps extends HTMLElementProps {
  children: JSX.Element[];
  /**
   * Should allowed to resized
   *
   * default is true
   */
  allowResize?: boolean;
  /**
   * How to split the space
   *
   * default is vertical
   */
  split?: "vertical" | "horizontal";
  /**
   * Only support controlled mode, so it's required
   */
  sizes: (string | number)[];
  sashRender: (index: number, active: boolean) => React.ReactNode;
  onChange: (sizes: number[], e: MouseEvent) => void;
  onDragStart?: (e: MouseEvent) => void;
  onDragEnd?: (e: MouseEvent) => void;
  onSashMouseEnter?: (e: MouseEvent) => void;
  className?: string;
  sashClassName?: string;
  performanceMode?: boolean;
  notComputedDis?: boolean;
  /**
   * Specify the size fo resizer
   *
   * defualt size is 4px
   */
  resizerSize?: number;
}

export interface ISashProps {
  split: string;
  className?: string;
  style: React.CSSProperties;
  render: (active: boolean) => void;
  onDragStart: React.MouseEventHandler<HTMLDivElement>;
  onDragging: React.MouseEventHandler<HTMLDivElement>;
  onDragEnd: React.MouseEventHandler<HTMLDivElement>;
  onSashMouseEnter?: (e: MouseEvent, split: string, index: number) => void;
  index: number;
  key: number;
}

export interface ISashContentProps {
  className?: string;
  type?: string;
  active?: boolean;
  children?: JSX.Element[];
}

export interface IPaneConfigs {
  maxSize?: number | string;
  minSize?: number | string;
  primary?: boolean;
}

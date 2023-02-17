import React, {
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
} from "react";
import Pane from "./pane";
import Sash from "./sash";
import SashContent from "./SashContent";
import {
  classNames,
  bodyDisableUserSelect,
  paneClassName,
  splitClassName,
  splitDragClassName,
  splitVerticalClassName,
  splitHorizontalClassName,
  sashDisabledClassName,
  sashHorizontalClassName,
  sashVerticalClassName,
  assertsSize,
} from "./base";
import { IAxis, ISplitProps, IPaneConfigs, ICacheSizes } from "./types";

const SplitPane = ({
  children,
  sizes: propSizes,
  allowResize = true,
  split = "vertical",
  className: wrapClassName,
  sashRender = (_, active) => <SashContent active={active} type="vscode" />,
  resizerSize = 4,
  performanceMode = false,
  onChange = () => null,
  onDragStart = () => null,
  onDragEnd = () => null,
  ...others
}: ISplitProps) => {
  const axis = useRef<IAxis>({ x: 0, y: 0 });
  const wrapper = useRef<HTMLDivElement>(null);
  const cacheSizes = useRef<ICacheSizes>({ sizes: [], sashPosSizes: [] });
  const [wrapperRect, setWrapperRect] = useState({});
  const [isDragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setWrapperRect(wrapper?.current?.getBoundingClientRect() ?? {});
    });
    resizeObserver.observe(wrapper.current!);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const { sizeName, splitPos, splitAxis } = useMemo(
    () => ({
      sizeName: split === "vertical" ? "width" : "height",
      splitPos: split === "vertical" ? "left" : "top",
      splitAxis: split === "vertical" ? "x" : "y",
    }),
    [split]
  );

  const wrapSize: number = wrapperRect[sizeName] ?? 0;

  // Get limit sizes via children
  const paneLimitSizes = useMemo(
    () =>
      children.map((childNode) => {
        const limits = [0, Infinity];
        if (childNode.type === Pane) {
          const { minSize, maxSize } = childNode.props as IPaneConfigs;
          limits[0] = assertsSize(minSize, wrapSize, 0);
          limits[1] = assertsSize(maxSize, wrapSize);
        }
        return limits;
      }),
    [children, wrapSize]
  );

  const sizes = useMemo(
    function () {
      // 计算尺寸在这里
      let count = 0;
      let curSum = 0; // 所有pane有明确大小尺寸的和
      let hasPrimarys: number[] = [];
      const res = children.map((_, index) => {
        const size = assertsSize(propSizes[index], wrapSize);
        size === Infinity ? count++ : (curSum += size);
        _.props.primary && hasPrimarys.push(index);
        return size;
      });

      if (count > 0) {
        // 没有拖动过进入
        const average = (wrapSize - curSum) / count;
        return res.map((size) => {
          return size === Infinity ? average : size;
        });
      }

      // resize or illegal size input,recalculate pane sizes
      if (curSum > wrapSize || (!count && curSum < wrapSize)) {
        // 拖动之后才进入
        let cacheNum = curSum - wrapSize;
        let computedRes: number[] = [];

        computedRes = res.map((size, index) => {
          if (hasPrimarys.includes(index)) {
            return size;
          }

          const virtualSize = size - cacheNum;
          if (
            paneLimitSizes[index][0] <= virtualSize &&
            paneLimitSizes[index][1] >= virtualSize
          ) {
            cacheNum = 0;
            return virtualSize;
          }

          if (paneLimitSizes[index][0] > virtualSize) {
            cacheNum -= size - paneLimitSizes[index][0];
            return paneLimitSizes[index][0];
          }

          if (paneLimitSizes[index][1] < virtualSize) {
            cacheNum -= paneLimitSizes[index][1] - size;
            return paneLimitSizes[index][1];
          }
        });


        if (cacheNum == 0) {
          return computedRes;
        } else {
          hasPrimarys.map((index: number) => {
            const size = computedRes[index];
            const virtualSize = size - cacheNum;

            if (
              paneLimitSizes[index][0] <= virtualSize &&
              paneLimitSizes[index][1] >= virtualSize
            ) {
              cacheNum = 0;
              computedRes[index] = virtualSize;
              return;
            }

            if (paneLimitSizes[index][0] > virtualSize) {
              cacheNum -= size - paneLimitSizes[index][0];
              computedRes[index] = paneLimitSizes[index][0];
              return;
            }

            if (paneLimitSizes[index][1] < virtualSize) {
              cacheNum -= paneLimitSizes[index][1] - size;
              computedRes[index] = paneLimitSizes[index][1];
              return;
            }
          });
          return computedRes;
        }
      } else {
        return [...propSizes];
      }
    },
    [...propSizes, children.length, wrapSize]
  );



  const sashPosSizes = useMemo(
    () => sizes.reduce((a, b) => [...a, a[a.length - 1] + b], [0]),
    [...sizes]
  );

  const dragStart = useCallback(
    function (e) {
      document?.body?.classList?.add(bodyDisableUserSelect);
      axis.current = { x: e.pageX, y: e.pageY };
      cacheSizes.current = { sizes, sashPosSizes };
      setDragging(true);
      onDragStart(e);
    },
    [onDragStart, sizes, sashPosSizes]
  );

  const dragEnd = useCallback(
    function (e) {
      document?.body?.classList?.remove(bodyDisableUserSelect);
      axis.current = { x: e.pageX, y: e.pageY };
      cacheSizes.current = { sizes, sashPosSizes };
      setDragging(false);
      onDragEnd(e);
    },
    [onDragEnd, sizes, sashPosSizes]
  );

  const onDragging = useCallback(
    function (e, i) {
      const curAxis = { x: e.pageX, y: e.pageY };
      let distanceX = curAxis[splitAxis] - axis.current[splitAxis];

      const leftBorder = -Math.min(
        sizes[i] - paneLimitSizes[i][0],
        paneLimitSizes[i + 1][1] - sizes[i + 1]
      );
      const rightBorder = Math.min(
        sizes[i + 1] - paneLimitSizes[i + 1][0],
        paneLimitSizes[i][1] - sizes[i]
      );

      if (distanceX < leftBorder) {
        distanceX = leftBorder;
      }
      if (distanceX > rightBorder) {
        distanceX = rightBorder;
      }

      const nextSizes = [...sizes];
      nextSizes[i] += distanceX;
      nextSizes[i + 1] -= distanceX;

      onChange(nextSizes);
    },
    [paneLimitSizes, onChange]
  );

  const paneFollow = !(performanceMode && isDragging);
  const paneSizes = paneFollow ? sizes : cacheSizes.current.sizes;
  const panePoses = paneFollow ? sashPosSizes : cacheSizes.current.sashPosSizes;
  return (
    <div
      className={classNames(
        splitClassName,
        split === "vertical" && splitVerticalClassName,
        split === "horizontal" && splitHorizontalClassName,
        isDragging && splitDragClassName,
        wrapClassName
      )}
      ref={wrapper}
      {...others}
    >
      {children.map((childNode, childIndex) => {
        const isPane = childNode.type === Pane;
        const paneProps = isPane ? childNode.props : {};

        return (
          <Pane
            key={childIndex}
            className={classNames(paneClassName, paneProps.className)}
            style={{
              ...paneProps.style,
              [sizeName]: paneSizes[childIndex],
              [splitPos]: panePoses[childIndex],
            }}
          >
            {isPane ? paneProps.children : childNode}
          </Pane>
        );
      })}
      {sashPosSizes.slice(1, -1).map((posSize, index) => (
        <Sash
          key={index}
          className={classNames(
            !allowResize && sashDisabledClassName,
            split === "vertical"
              ? sashVerticalClassName
              : sashHorizontalClassName
          )}
          style={{
            [sizeName]: resizerSize,
            [splitPos]: posSize - resizerSize / 2,
          }}
          render={sashRender.bind(null, index)}
          onDragStart={dragStart}
          onDragging={(e) => onDragging(e, index)}
          onDragEnd={dragEnd}
        />
      ))}
    </div>
  );
};

export default SplitPane;

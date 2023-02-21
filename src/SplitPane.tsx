/*此插件只需要保证当前时刻面板值（cacheSizes.current.sizes）和对应的鼠标位置的参考值axis.current正确其他的就不用管。例如我们通过size的方式修改面板大小（而不是拖拽）后，就需要同步这个两个值，例如224/228行*/

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
  notComputedDis = false,
  allowResize = true,
  split = "vertical",
  className: wrapClassName,
  sashRender = (_, active) => <SashContent active={active} type="vscode" />,
  resizerSize = 4,
  performanceMode = false,
  onChange = () => null,
  onDragStart = () => null,
  onDragEnd = () => null,
  onSashMouseEnter = () => {},
  ...others
}: ISplitProps) => {
  const notComputedDisRef = useRef<boolean>(notComputedDis);
  const eventSelf = useRef<any>(null);
  const axis = useRef<IAxis>({ x: 0, y: 0 });
  const wrapper = useRef<HTMLDivElement>(null);
  const cacheSizes = useRef<ICacheSizes>({ sizes: [], sashPosSizes: [] });
  const [wrapperRect, setWrapperRect] = useState({});
  const [isDragging, setDragging] = useState<boolean>(false);
  const referSizeRef = useRef<number[]>([]);

  notComputedDisRef.current = notComputedDis;

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
        referSizeRef.current[index] = size;
        return size;
      });

      if (count > 0) {
        // 没有拖动过进入
        const average = (wrapSize - curSum) / count;
        return res.map((size, index) => {
          const computedSize = size === Infinity ? average : size;
          referSizeRef.current[index] = computedSize;
          return computedSize;
        });
      }

      // resize or illegal size input,recalculate pane sizes
      // 拖动之后才进入

      curSum = referSizeRef.current.reduce((before, curt) => before + curt, 0);
      if (curSum > wrapSize || (!count && curSum < wrapSize)) {
        let cacheNum = curSum - wrapSize;
        let computedRes: number[] = [];

        computedRes = res.map((size, index) => {
          if (hasPrimarys.includes(index)) {
            referSizeRef.current[index] = size;
            return size;
          }

          const virtualSize = size - cacheNum;
          if (
            paneLimitSizes[index][0] <= virtualSize &&
            paneLimitSizes[index][1] >= virtualSize
          ) {
            cacheNum = 0;
            referSizeRef.current[index] = virtualSize;
            return virtualSize;
          }

          if (paneLimitSizes[index][0] > virtualSize) {
            cacheNum -= size - paneLimitSizes[index][0];
            referSizeRef.current[index] = paneLimitSizes[index][0];
            return paneLimitSizes[index][0];
          }

          if (paneLimitSizes[index][1] < virtualSize) {
            cacheNum -= paneLimitSizes[index][1] - size;
            referSizeRef.current[index] = paneLimitSizes[index][1];
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
              referSizeRef.current[index] = virtualSize;
              return;
            }

            if (paneLimitSizes[index][0] > virtualSize) {
              cacheNum -= size - paneLimitSizes[index][0];
              computedRes[index] = paneLimitSizes[index][0];
              referSizeRef.current[index] = paneLimitSizes[index][0];
              return;
            }

            if (paneLimitSizes[index][1] < virtualSize) {
              cacheNum -= paneLimitSizes[index][1] - size;
              computedRes[index] = paneLimitSizes[index][1];
              referSizeRef.current[index] = paneLimitSizes[index][1];
              return;
            }
          });
          return computedRes;
        }
      } else {
        return [...propSizes];
      }
    },
    [propSizes, children.length, wrapSize, notComputedDis]
  );

  const sashPosSizes = useMemo(
    () => sizes.reduce((a, b) => [...a, a[a.length - 1] + b], [0]),
    [...sizes]
  );

  const dragStart = useCallback(
    function (e) {
      document?.body?.classList?.add(bodyDisableUserSelect);
      axis.current = { x: e.clientX, y: e.clientY };
      cacheSizes.current = { sizes, sashPosSizes }; // 缓存数据和分割线位置
      eventSelf.current = e;
      setDragging(true);
      onDragStart(e);
    },
    [onDragStart, sizes, sashPosSizes]
  );

  const dragEnd = useCallback(
    function (e) {
      document?.body?.classList?.remove(bodyDisableUserSelect);
      axis.current = { x: e.clientX, y: e.clientY };
      cacheSizes.current = { sizes, sashPosSizes };
      setDragging(false);
      onDragEnd(e);
    },
    [onDragEnd, sizes, sashPosSizes]
  );
  const onDragging = useCallback(
    // 里面用的sizes等于cacheSizes.current.sizes。即使我们在deps里加入sizes，下面的sizes也不会立即更新。
    // 我们可以把sashPosSizes也存一个current值以供后面使用
    function (e, i) {
      if (notComputedDisRef.current) {
        axis.current = {
          x: window.innerWidth - referSizeRef.current[1],
          y: e.clientY,
        };
        cacheSizes.current.sizes = referSizeRef.current;
        onChange([...referSizeRef.current], e);
        return;
      }
      const curAxis = { x: e.clientX, y: e.clientY };
      let distanceX = curAxis[splitAxis] - axis.current[splitAxis];

      const leftBorder = -Math.min(
        cacheSizes.current.sizes[i] - paneLimitSizes[i][0],
        paneLimitSizes[i + 1][1] - cacheSizes.current.sizes[i + 1]
      );
      const rightBorder = Math.min(
        cacheSizes.current.sizes[i + 1] - paneLimitSizes[i + 1][0],
        paneLimitSizes[i][1] - cacheSizes.current.sizes[i]
      );
      if (distanceX < leftBorder) {
        distanceX = leftBorder;
      }
      if (distanceX > rightBorder) {
        distanceX = rightBorder;
      }

      const nextSizes = [...cacheSizes.current.sizes];
      nextSizes[i] += distanceX;
      nextSizes[i + 1] -= distanceX;
      referSizeRef.current = nextSizes;

      onChange(nextSizes, e);
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
              willChange: sizeName,
            }}
          >
            {isPane ? paneProps.children : childNode}
          </Pane>
        );
      })}
      {sashPosSizes.slice(1, -1).map((posSize, index) => (
        <Sash
          key={index}
          index={index}
          split={split}
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
          onSashMouseEnter={onSashMouseEnter}
        />
      ))}
    </div>
  );
};

export default SplitPane;

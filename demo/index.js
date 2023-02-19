import React, { useState, useCallback, useRef } from "react";
import { useReactive, useMemoizedFn } from "ahooks";
import SplitPane, { Pane } from "split-pane-react-fixed";
import "split-pane-react-fixed/esm/themes/default.css";

export default () => {
  const datas = useReactive({
    sizes: [461, "auto"],
    sizes1: ["auto", 200],
    sizes2: ["auto", 350],
    notComputedDis: false, // datas.sizes2[0]==580
  }); 

  const layoutCSS = {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };


  const setZhi = useMemoizedFn((values, e) => {
    console.log({ values });
    if (e.movementX < 0 && values[0] <= 580) { 
      if (datas.sizes[0] + e.movementX >= 426 && values[1] <= 590) {  // 往左拉
        datas.notComputedDis = true;
        datas.sizes2 = [580, "auto"];
        datas.sizes = [datas.sizes[0] + e.movementX, "auto"];
        return;
      }
      
    }
    
    if (e.movementX > 0) { 
      datas.notComputedDis = false;
    }
    
    datas.sizes2 = values;
  });

  const sashMouseEnter = useMemoizedFn((e) => {
    // console.log({e})
  }, []);
 
  console.log({ tre: datas.notComputedDis });

  return (
    <div style={{ height: 500 }}>
      <SplitPane
        resizerSize={1}
        sizes={datas.sizes}
        onChange={(value) => (datas.sizes = value)}
        sashRender={() => <div>左右拖拽调整区域大小</div>}
      >
        <Pane minSize={426} maxSize={900}>
          <div style={{ ...layoutCSS, background: "red" }} />
        </Pane>

        <Pane minSize={930}>
          <SplitPane
            resizerSize={1}
            split="horizontal"
            sizes={datas.sizes1}
            onChange={(value) => (datas.sizes1 = value)}
            sashRender={() => <div>上下拖拽调整区域大小</div>}
          >
            <Pane minSize={200}>
              <SplitPane
                resizerSize={1}
                sizes={datas.sizes2}
                onChange={setZhi}
                onDragEnd={() => (datas.notComputedDis = false)}
                sashRender={() => <div>左右拖拽调整区域大小</div>}
                onSashMouseEnter={sashMouseEnter}
                notComputedDis={datas.notComputedDis}
              >
                <Pane minSize={580} primary={datas.notComputedDis}>
                  <div style={{ ...layoutCSS, background: "blue" }} />
                </Pane>

                <Pane
                  primary={!datas.notComputedDis}
                  minSize={350}
                  maxSize={590}
                  className="properPane"
                >
                  <div
                    className="container"
                    style={{ ...layoutCSS, background: "#ccc" }}
                  />
                </Pane>
              </SplitPane>
            </Pane>

            <Pane minSize={200} maxSize={544}>
              <div style={{ ...layoutCSS, background: "green" }} />
            </Pane>
          </SplitPane>
        </Pane>
      </SplitPane>
    </div>
  );
};

import {useCallback, useRef} from '@storybook/client-api';
import React, { useState } from 'react';
import SplitPane, {Pane } from '../src';
import '../src/themes/default.scss';

export default {
    title: 'Basic',
};

export const ComplexLayout = () => {
    const [sizes, setSizes] = useState<(number | string)[]>([461, "auto"]);
    const [sizes1, setSizes1] = useState<(number | string)[]>(["auto", 210]);
    const [sizes2, setSizes2] = useState<(number | string)[]>(["auto", 200]);

    const layoutCSS = {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
  };

  const notComputedDis = useRef(false);
  
  const setZhi = useCallback((values, e) => { 
    console.log({ values });
    if (values[0] == 300 && e.movementX < 0) {
      notComputedDis.current = true;
      setSizes([sizes[0] + e.movementX, sizes[1] - e.movementX]);
    } else {
      notComputedDis.current = false;
      setSizes2(values);
    }
  },[]);
  
  const sashMouseEnter = useCallback((e) => {
    // console.log({e})
  }, []);
  
    return (
      <div style={{ height: 500 }}>
        <SplitPane
          resizerSize={1}
          sizes={sizes}
          onChange={setSizes}
          sashRender={() => <div>左右拖拽调整区域大小</div>}
        >
          <Pane minSize={230} maxSize={900}>
            <div style={{ ...layoutCSS, background: "red" }}></div>
          </Pane>

          <Pane minSize={465}>
            <SplitPane
              resizerSize={1}
              split="horizontal"
              sizes={sizes1}
              onChange={setSizes1}
              sashRender={() => <div>上下拖拽调整区域大小</div>}
            >
              <Pane minSize={200}>
                <SplitPane
                  resizerSize={1}
                  sizes={sizes2}
                  onChange={setZhi}
                  onDragEnd={() => (notComputedDis.current = false)}
                  sashRender={() => <div>左右拖拽调整区域大小</div>}
                  onSashMouseEnter={sashMouseEnter}
                  notComputedDis={notComputedDis.current}
                >
                  <Pane minSize={300} primary={sizes2[0] == 300}>
                    <div style={{ ...layoutCSS, background: "blue" }}></div>
                  </Pane>

                  <Pane
                    primary={sizes2[0] != 300 && !notComputedDis.current}
                    minSize={150}
                    maxSize={295}
                    className="properPane"
                  >
                    <div
                      className="container"
                      style={{ ...layoutCSS, background: "#ccc" }}
                    ></div>
                  </Pane>
                </SplitPane>
              </Pane>

              <Pane minSize={50} maxSize={544}>
                <div style={{ ...layoutCSS, background: "green" }}></div>
              </Pane>
            </SplitPane>
          </Pane>
        </SplitPane>
      </div>
    );
};

import React, { JSX } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Examples from './Examples';
import BasicEntityExample from './basic_entity_example';
import ClickComponentExample from './click_component_example';
import InputPluginExample from './input_plugin_example';

const Router = (): JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/'} element={<Examples />} />
        <Route path={'/basic_entity_example'} element={<BasicEntityExample />} />
        <Route path={'/click_component_example'} element={<ClickComponentExample />} />
        <Route path={'/input_plugin_example'} element={<InputPluginExample />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;

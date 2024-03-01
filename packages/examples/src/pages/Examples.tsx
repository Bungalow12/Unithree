import { JSX } from 'react';

const Examples = (): JSX.Element => {
  return (
    <div>
      <ul>
        <li>
          <a href={'./basic_entity_example'}>Basic Entity Example</a>
        </li>
        <li>
          <a href={'./click_component_example'}>Clickable Component Example</a>
        </li>
        <li>
          <a href={'./input_plugin_example'}>Input Plugin Example</a>
        </li>
      </ul>
    </div>
  );
};

export default Examples;

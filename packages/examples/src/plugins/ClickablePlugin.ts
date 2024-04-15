import { Object3D, Raycaster, Vector2 } from 'three';
import { ColorChangeClickableComponent } from '../components';
import Unithree from '@unithree/core/State';
import ProcessorPlugin from '@unithree/core/ProcessorPlugin';
import Entity from '@unithree/core/Entity';
import Component from '@unithree/core/Component';

/**
 * Sets up a click event to handle all components with the ColorChangeClickableComponent
 */
export class ClickablePlugin extends ProcessorPlugin {
  constructor() {
    super();
  }

  private onClick = (event: MouseEvent) => {
    // Get all Entities from the scene with ColorChangeClickableComponent attached
    const scene = Unithree.getScene();
    const clickableEntities: Entity[] = [];
    scene.traverse((object: Object3D) => {
      if (object instanceof Entity) {
        const entity = object as Entity;
        entity.components.forEach((component: Component) => {
          if (component instanceof ColorChangeClickableComponent) {
            clickableEntities.push(component.entity);
          }
        });
      }
    });

    // Perform Raycast with those items
    const pointer = new Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );

    const raycaster = new Raycaster();
    raycaster.setFromCamera(pointer, Unithree.getCamera());
    const intersections = raycaster.intersectObjects(clickableEntities);

    // For the closest returned call OnClick on component
    if (intersections.length > 0) {
      const hitObject = intersections[0].object;

      let currentObject: Object3D | null = hitObject;
      let nearestEntity: Entity | null = hitObject instanceof Entity ? hitObject : null;
      while (currentObject) {
        if (currentObject.parent instanceof Entity) {
          nearestEntity = currentObject.parent;
          break;
        }
        currentObject = currentObject.parent;
      }

      nearestEntity?.components.forEach((component) => {
        if (component instanceof ColorChangeClickableComponent) {
          (component as ColorChangeClickableComponent).onClick(intersections[0]);
        }
      });
    }
  };

  public initialize(): void {
    Unithree.getRenderer().domElement.addEventListener('click', this.onClick);
  }

  public dispose(): void {
    Unithree.getRenderer().domElement.removeEventListener('click', this.onClick);
  }
}

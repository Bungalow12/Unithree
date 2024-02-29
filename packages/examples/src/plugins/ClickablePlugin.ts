import * as THREE from 'three';
import { Entity, ExecutionType, UnithreePlugin, UnithreeState } from 'unithree';
import { ColorChangeClickableComponent } from '../components';

/**
 * Sets up a click event to handle all components with the ColorChangeClickableComponent
 */
export class ClickablePlugin implements UnithreePlugin {
  public executionType = ExecutionType.Once;

  public run(): void {
    if (!UnithreeState.getRenderer() || !UnithreeState.getCamera()) {
      throw new Error('Please initialize Unithree');
    }

    UnithreeState.getRenderer().domElement.addEventListener('click', (event: MouseEvent) => {
      // Get all Entities from the scene with ColorChangeClickableComponent attached
      const scene = UnithreeState.getScene();
      const clickableEntities: Entity[] = [];
      scene.traverse((object) => {
        if (object instanceof Entity) {
          const entity = object as Entity;
          entity.components.forEach((component) => {
            if (component instanceof ColorChangeClickableComponent) {
              clickableEntities.push(component.entity);
            }
          });
        }
      });

      // Perform Raycast with those items
      const pointer = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, UnithreeState.getCamera());
      const intersections = raycaster.intersectObjects(clickableEntities);

      // For the closest returned call OnClick on component
      if (intersections.length > 0) {
        const hitObject = intersections[0].object;

        let currentObject: THREE.Object3D | null = hitObject;
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
    });
  }
}

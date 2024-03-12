import { Color, ColorRepresentation, Intersection, Mesh, MeshStandardMaterial } from 'three';
import { Component, Entity } from 'unithree';

export class ColorChangeClickableComponent implements Component {
  private colors: ColorRepresentation[] = [0x00ff00, 0xff0000];
  private currentColorIndex = 0;
  public entity: Entity;

  constructor(entity: Entity) {
    this.entity = entity;
    this.onClick = this.onClick.bind(this);
  }

  public onClick(intersection: Intersection): void {
    this.currentColorIndex = this.currentColorIndex === 0 ? 1 : 0;
    const mesh = intersection.object as Mesh;
    (mesh.material as MeshStandardMaterial).color = new Color().set(this.colors[this.currentColorIndex]);
  }
}

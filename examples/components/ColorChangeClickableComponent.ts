import { Component, Entity } from '../../src';

export class ColorChangeClickableComponent implements Component {
  public entity: Entity;

  constructor(entity: Entity) {
    this.entity = entity;
    this.onClick = this.onClick.bind(this);
  }

  public onClick(): void {
    // Perform color change on the clicked entity
  }
}

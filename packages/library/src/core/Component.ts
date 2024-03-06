import { Entity } from './Entity';

/**
 * The base Component interface.
 */
export interface Component {
  entity: Entity | null;
}

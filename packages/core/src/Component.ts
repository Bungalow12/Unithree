import Entity from './Entity';

/**
 * The base Component interface.
 */
interface Component {
  entity: Entity | null;
}

export default Component;

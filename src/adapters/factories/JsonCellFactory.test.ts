import { JsonCellFactory, MalformedCellSpecError } from './JsonCellFactory';
import { ArrowCell } from '../../domain/entities/ArrowCell';
import { WallCell } from '../../domain/entities/WallCell';
import { EmptyCell } from '../../domain/entities/EmptyCell';
import { ExitCell } from '../../domain/entities/ExitCell';
import { Direction } from '../../domain/value-objects/Direction';
import { Position } from '../../domain/value-objects/Position';
import { InvalidDirectionError } from '../../domain/errors';
import type { CellSpec } from '../../application/ports/ICellFactory';

describe('JsonCellFactory', () => {
  const factory = new JsonCellFactory();
  const at = new Position(0, 0);

  it('should_build_an_arrow_cell_with_its_direction_when_kind_is_arrow', () => {
    // Act
    const cell = factory.create({ kind: 'ARROW', direction: 'LEFT' }, at);

    // Assert
    expect(cell).toBeInstanceOf(ArrowCell);
    expect((cell as ArrowCell).direction).toBe(Direction.LEFT);
  });

  it('should_build_the_matching_cell_type_when_spec_is_wall_empty_or_exit', () => {
    expect(factory.create({ kind: 'WALL' }, at)).toBeInstanceOf(WallCell);
    expect(factory.create({ kind: 'EMPTY' }, at)).toBeInstanceOf(EmptyCell);
    expect(factory.create({ kind: 'EXIT' }, at)).toBeInstanceOf(ExitCell);
  });

  it('should_throw_MalformedCellSpecError_when_an_arrow_has_no_direction', () => {
    expect(() => factory.create({ kind: 'ARROW' }, at)).toThrow(MalformedCellSpecError);
  });

  it('should_throw_InvalidDirectionError_when_an_arrow_direction_is_invalid', () => {
    expect(() => factory.create({ kind: 'ARROW', direction: 'NORTH' as never }, at)).toThrow(
      InvalidDirectionError,
    );
  });

  it('should_throw_MalformedCellSpecError_when_the_kind_is_unknown', () => {
    expect(() => factory.create({ kind: 'PORTAL' } as unknown as CellSpec, at)).toThrow(
      MalformedCellSpecError,
    );
  });
});
